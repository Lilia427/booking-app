import 'dotenv/config';
import dataSource from '../src/data-source';
import { AdminEntity } from '../src/admin/entities/admin.entity';

async function seedDefaultAdmin() {
  const name = process.env.DEFAULT_ADMIN_NAME;
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('Set DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD in .env');
  }

  await dataSource.initialize();

  try {
    const adminRepository = dataSource.getRepository(AdminEntity);
    const adminsCount = await adminRepository.count();

    if (adminsCount > 0) {
      console.log('Admin already exists, skip seeding.');
      return;
    }

    const admin = adminRepository.create({
      name,
      email,
      password,
    });

    const saved = await adminRepository.save(admin);
    console.log(`Default admin created (id=${saved.id}, email=${saved.email}).`);
  } finally {
    await dataSource.destroy();
  }
}

seedDefaultAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
