// Tweak estándar de Nest para webpack: silencia los errores de resolución
// de peer-dependencies opcionales que tira @nestjs/core para transports
// que no usamos.
module.exports = function (options, webpack) {
  const lazyImports = [
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    'class-transformer/storage',
    'cache-manager',
    '@fastify/static',
    '@fastify/view',
  ];

  return {
    ...options,
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource);
          } catch {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
