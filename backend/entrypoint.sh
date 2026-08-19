#!/bin/sh

DB_HOST_NAME=${DB_HOST:-db}
DB_PORT_NUM=${DB_PORT:-5432}

echo "Waiting for database at ${DB_HOST_NAME}:${DB_PORT_NUM} to accept connections..."
until nc -z "$DB_HOST_NAME" "$DB_PORT_NUM"; do
  echo "Database is not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "Database is ready! Running migrations..."
npx sequelize-cli db:migrate

echo "Starting the application..."
if [ "$NODE_ENV" = "production" ]; then
  npm run build && npm start
else
  npm run dev
fi
