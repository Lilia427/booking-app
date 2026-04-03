import 'dotenv/config';
import { DataSource } from 'typeorm';

const useSsl =
  process.env.PGSSLMODE === 'require' ||
  process.env.PGSSLMODE === 'no-verify';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5433'),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'diploma_db',
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
