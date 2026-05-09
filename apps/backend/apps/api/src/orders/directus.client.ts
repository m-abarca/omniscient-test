import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateOrderInput, ProductionOrder } from '@omniscient/types';

const COLLECTION = 'production_orders';
const TOKEN_REFRESH_MARGIN_MS = 30_000;

type DirectusResponse<T> = { data: T };

interface LoginResponse {
  data: {
    access_token: string;
    expires: number;
    refresh_token?: string;
  };
}

@Injectable()
export class DirectusClient {
  private readonly logger = new Logger(DirectusClient.name);
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;

  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private inflightLogin: Promise<string> | null = null;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('DIRECTUS_URL');
    this.email = config.getOrThrow<string>('DIRECTUS_ADMIN_EMAIL');
    this.password = config.getOrThrow<string>('DIRECTUS_ADMIN_PASSWORD');
  }

  list(filter?: Record<string, unknown>): Promise<ProductionOrder[]> {
    const url = new URL(`/items/${COLLECTION}`, this.baseUrl);
    url.searchParams.set('limit', '-1');
    url.searchParams.set('sort', '-createdAt');
    if (filter) {
      url.searchParams.set('filter', JSON.stringify(filter));
    }
    return this.request<DirectusResponse<ProductionOrder[]>>('GET', url).then(
      (r) => r.data,
    );
  }

  listPlanned(): Promise<ProductionOrder[]> {
    return this.list({ status: { _eq: 'planned' } });
  }

  create(input: CreateOrderInput): Promise<ProductionOrder> {
    const url = new URL(`/items/${COLLECTION}`, this.baseUrl);
    return this.request<DirectusResponse<ProductionOrder>>(
      'POST',
      url,
      input,
    ).then((r) => r.data);
  }

  patch(
    id: string,
    partial: Partial<ProductionOrder>,
  ): Promise<ProductionOrder> {
    const url = new URL(`/items/${COLLECTION}/${id}`, this.baseUrl);
    return this.request<DirectusResponse<ProductionOrder>>(
      'PATCH',
      url,
      partial,
    ).then((r) => r.data);
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.accessToken &&
      this.accessTokenExpiresAt - TOKEN_REFRESH_MARGIN_MS > now
    ) {
      return this.accessToken;
    }
    if (this.inflightLogin) {
      return this.inflightLogin;
    }
    this.inflightLogin = (async () => {
      const url = new URL('/auth/login', this.baseUrl);
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });
      } catch (err) {
        throw new ServiceUnavailableException(
          `Directus unreachable for login: ${(err as Error).message}`,
        );
      }
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Directus login failed: ${res.status} ${text}`);
        throw new ServiceUnavailableException(
          `Directus login failed (${res.status})`,
        );
      }
      const json = (await res.json()) as LoginResponse;
      this.accessToken = json.data.access_token;
      this.accessTokenExpiresAt = Date.now() + (json.data.expires ?? 900_000);
      return this.accessToken;
    })().finally(() => {
      this.inflightLogin = null;
    });
    return this.inflightLogin;
  }

  private async request<T>(
    method: string,
    url: URL,
    body?: unknown,
    retried = false,
  ): Promise<T> {
    const token = await this.getAccessToken();
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(
        `Directus ${method} ${url.toString()} network error: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException('Directus is unreachable');
    }

    if (res.status === 401 && !retried) {
      await this.getAccessToken(true);
      return this.request(method, url, body, true);
    }

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(
        `Directus ${method} ${url.toString()} → ${res.status}: ${text}`,
      );
      throw new ServiceUnavailableException(
        `Directus responded ${res.status}`,
      );
    }
    return (await res.json()) as T;
  }
}
