import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

const ds = new DataSource(databaseConfig);

// ── Helpers ────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

// ── IDs ────────────────────────────────────────────────────────────────────

const U = {
  ana:    uuidv4(),
  carlos: uuidv4(),
  sofia:  uuidv4(),
  diego:  uuidv4(),
  maria:  uuidv4(),
  pablo:  uuidv4(),
};

const UP = {
  ana:    uuidv4(),
  carlos: uuidv4(),
  sofia:  uuidv4(),
  diego:  uuidv4(),
  maria:  uuidv4(),
  pablo:  uuidv4(),
};

const EC = {
  roberto: uuidv4(),
  laura:   uuidv4(),
  tomas:   uuidv4(),
  valeria: uuidv4(),
  felipe:  uuidv4(),
};

const A = {
  futbol5:  uuidv4(),
  tenis:    uuidv4(),
  natacion: uuidv4(),
  paddle:   uuidv4(),
  basket:   uuidv4(),
  running:  uuidv4(),
  tenisInd: uuidv4(),
  futbol7:  uuidv4(),
};

const AO = {
  futbol5:  uuidv4(),
  tenis:    uuidv4(),
  natacion: uuidv4(),
  paddle:   uuidv4(),
  basket:   uuidv4(),
  running:  uuidv4(),
  tenisInd: uuidv4(),
  futbol7:  uuidv4(),
};

// ── Seed ──────────────────────────────────────────────────────────────────

async function seed() {
  await ds.initialize();
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('🌱 Limpiando tablas...');

    await qr.query(`
      TRUNCATE
        activity_invitations,
        activity_participations,
        activity_open,
        activities,
        contacts,
        external_contacts,
        email_verification_tokens,
        password_reset_tokens,
        user_profiles,
        users
      RESTART IDENTITY CASCADE
    `);

    // ── 1. Usuarios ────────────────────────────────────────────────────────
    console.log('👤 Insertando usuarios...');

    const passwordHash = await bcrypt.hash('Password123', 10);
    const now = new Date();

    const users = [
      { id: U.ana,    email: 'ana@klupni.com',    verified: daysAgo(60) },
      { id: U.carlos, email: 'carlos@klupni.com', verified: daysAgo(55) },
      { id: U.sofia,  email: 'sofia@klupni.com',  verified: daysAgo(40) },
      { id: U.diego,  email: 'diego@klupni.com',  verified: daysAgo(35) },
      { id: U.maria,  email: 'maria@klupni.com',  verified: daysAgo(20) },
      { id: U.pablo,  email: 'pablo@klupni.com',  verified: daysAgo(10) },
    ];

    for (const u of users) {
      await qr.query(
        `INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [u.id, u.email, passwordHash, u.verified, now],
      );
    }

    // ── 2. Perfiles ────────────────────────────────────────────────────────
    console.log('🪪 Insertando perfiles...');

    const profiles = [
      { id: UP.ana,    userId: U.ana,    first: 'Ana',    last: 'García',    username: 'anagarcia',   avatar: 'https://i.pravatar.cc/150?u=ana'    },
      { id: UP.carlos, userId: U.carlos, first: 'Carlos', last: 'Martínez',  username: 'carlosmtz',   avatar: 'https://i.pravatar.cc/150?u=carlos'  },
      { id: UP.sofia,  userId: U.sofia,  first: 'Sofía',  last: 'López',     username: 'sofilopez',   avatar: 'https://i.pravatar.cc/150?u=sofia'   },
      { id: UP.diego,  userId: U.diego,  first: 'Diego',  last: 'Torres',    username: 'diegotorres', avatar: 'https://i.pravatar.cc/150?u=diego'   },
      { id: UP.maria,  userId: U.maria,  first: 'María',  last: 'Fernández', username: 'mariafz',     avatar: 'https://i.pravatar.cc/150?u=maria'   },
      { id: UP.pablo,  userId: U.pablo,  first: 'Pablo',  last: 'Ramírez',   username: 'pabloram',    avatar: 'https://i.pravatar.cc/150?u=pablo'   },
    ];

    for (const p of profiles) {
      await qr.query(
        `INSERT INTO user_profiles (id, user_id, first_name, last_name, username, avatar_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
        [p.id, p.userId, p.first, p.last, p.username, p.avatar, now],
      );
    }

    // ── 3. External Contacts ───────────────────────────────────────────────
    console.log('📇 Insertando external contacts...');

    const contacts = [
      { id: EC.roberto, owner: U.ana,    alias: 'Roberto Silva',  email: null,                   phone: '+56912340001' },
      { id: EC.laura,   owner: U.ana,    alias: 'Laura Vega',     email: 'laura.vega@gmail.com', phone: '+56912340002' },
      { id: EC.tomas,   owner: U.carlos, alias: 'Tomás Ríos',     email: 'tomas.rios@gmail.com', phone: null          },
      { id: EC.valeria, owner: U.carlos, alias: 'Valeria Castro', email: 'valeria@gmail.com',    phone: '+56912340003' },
      { id: EC.felipe,  owner: U.diego,  alias: 'Felipe Morales', email: null,                   phone: '+56912340004' },
    ];

    for (const c of contacts) {
      await qr.query(
        `INSERT INTO external_contacts (id, owner_user_id, alias, email, phone_number, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [c.id, c.owner, c.alias, c.email, c.phone, now],
      );
    }

    // ── 3b. Contacts (relación usuario ↔ external_contact) ───────────────────
    console.log('📇 Insertando contacts...');

    for (const c of contacts) {
      await qr.query(
        `INSERT INTO contacts (id, owner_user_id, user_id, external_contact_id, created_at, updated_at)
         VALUES ($1, $2, NULL, $3, $4, $4)`,
        [uuidv4(), c.owner, c.id, now],
      );
    }

    // ── 4. Actividades ─────────────────────────────────────────────────────
    console.log('🏃 Insertando actividades...');

    const activities = [
      {
        id: A.futbol5,  creator: U.ana,    title: 'Fútbol 5 en Parque Araucano',
        desc: 'Partido de fútbol 5 con amigos en la cancha sintética del parque.',
        startAt: daysAgo(60),     endAt: daysAgo(60),     status: 'completed',
      },
      {
        id: A.tenis,    creator: U.carlos, title: 'Tenis dobles — Club Manquehue',
        desc: 'Dobles de tenis. Traer raqueta y pelotas.',
        startAt: daysAgo(42),     endAt: daysAgo(42),     status: 'completed',
      },
      {
        id: A.natacion, creator: U.diego,  title: 'Natación libre — Piscina Municipal',
        desc: 'Turno de natación libre. Capacidad limitada por carriles.',
        startAt: daysAgo(21),     endAt: daysAgo(21),     status: 'completed',
      },
      {
        id: A.paddle,   creator: U.ana,    title: 'Paddle en SportCenter',
        desc: 'Partido de paddle en canchas techadas. Nivel intermedio.',
        startAt: daysFromNow(7),  endAt: daysFromNow(7),  status: 'open',
      },
      {
        id: A.basket,   creator: U.diego,  title: 'Básquetbol 3x3 — Plaza de Maipú',
        desc: '3 vs 3 en la cancha de la plaza. Trae agua.',
        startAt: daysFromNow(14), endAt: daysFromNow(14), status: 'open',
      },
      {
        id: A.running,  creator: U.sofia,  title: 'Running matutino — Parque Bicentenario',
        desc: 'Salida de 8 km a ritmo moderado. Punto de encuentro: entrada principal.',
        startAt: daysFromNow(21), endAt: daysFromNow(21), status: 'open',
      },
      {
        id: A.tenisInd, creator: U.carlos, title: 'Tenis individuales — Club Providencia',
        desc: 'Singles de tenis. Nivel avanzado. Solo 2 jugadores.',
        startAt: daysFromNow(30), endAt: daysFromNow(30), status: 'open',
      },
      {
        id: A.futbol7,  creator: U.pablo,  title: 'Fútbol 7 — Cancha Sintética Las Condes',
        desc: 'Partido completo de fútbol 7. Equipos armados, faltan algunos jugadores.',
        startAt: daysFromNow(35), endAt: daysFromNow(35), status: 'open',
      },
    ];

    for (const a of activities) {
      await qr.query(
        `INSERT INTO activities (id, created_by_user_id, title, description, start_at, end_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [a.id, a.creator, a.title, a.desc, a.startAt, a.endAt, a.status, now],
      );
    }

    // ── 5. Activity Open ───────────────────────────────────────────────────
    console.log('📋 Insertando activity_open...');

    const opens = [
      { id: AO.futbol5,  actId: A.futbol5,  sport: 'Fútbol',     loc: 'Parque Araucano, Santiago',     max: 10, min: 6  },
      { id: AO.tenis,    actId: A.tenis,    sport: 'Tenis',      loc: 'Club Manquehue, Las Condes',    max: 4,  min: 4  },
      { id: AO.natacion, actId: A.natacion, sport: 'Natación',   loc: 'Piscina Municipal de Maipú',    max: 8,  min: 3  },
      { id: AO.paddle,   actId: A.paddle,   sport: 'Paddle',     loc: 'SportCenter, Providencia',      max: 4,  min: 4  },
      { id: AO.basket,   actId: A.basket,   sport: 'Básquetbol', loc: 'Plaza de Maipú, Maipú',         max: 6,  min: 4  },
      { id: AO.running,  actId: A.running,  sport: 'Running',    loc: 'Parque Bicentenario, Vitacura', max: 12, min: 4  },
      { id: AO.tenisInd, actId: A.tenisInd, sport: 'Tenis',      loc: 'Club Providencia, Providencia', max: 2,  min: 2  },
      { id: AO.futbol7,  actId: A.futbol7,  sport: 'Fútbol',     loc: 'Cancha Sintética Las Condes',   max: 14, min: 10 },
    ];

    for (const o of opens) {
      await qr.query(
        `INSERT INTO activity_open (id, activity_id, sport_name, location_text, max_participants, min_participants, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
        [o.id, o.actId, o.sport, o.loc, o.max, o.min, now],
      );
    }

    // ── 6. Participaciones ─────────────────────────────────────────────────
    // Columnas: id, actId, userId, extId, alias, role, status, joinedAt
    console.log('🙋 Insertando participaciones...');

    type Part = {
      actId: string;
      userId: string | null;
      extId: string | null;
      alias: string | null;
      role: string;
      status: string;
      joinedAt: Date;
    };

    const parts: Part[] = [
      // Fútbol 5 (pasado)
      { actId: A.futbol5, userId: U.ana,    extId: null,       alias: null,          role: 'host',        status: 'active', joinedAt: daysAgo(61) },
      { actId: A.futbol5, userId: U.carlos, extId: null,       alias: null,          role: 'participant', status: 'active', joinedAt: daysAgo(60) },
      { actId: A.futbol5, userId: U.sofia,  extId: null,       alias: null,          role: 'participant', status: 'active', joinedAt: daysAgo(60) },
      { actId: A.futbol5, userId: null,     extId: EC.roberto, alias: null,          role: 'participant', status: 'active', joinedAt: daysAgo(60) },

      // Tenis dobles (pasado)
      { actId: A.tenis, userId: U.carlos, extId: null, alias: null,       role: 'host',        status: 'active', joinedAt: daysAgo(43) },
      { actId: A.tenis, userId: U.diego,  extId: null, alias: null,       role: 'participant', status: 'active', joinedAt: daysAgo(43) },
      { actId: A.tenis, userId: null,     extId: null, alias: 'Rodrigo',  role: 'participant', status: 'active', joinedAt: daysAgo(43) },
      { actId: A.tenis, userId: null,     extId: null, alias: 'Ignacio',  role: 'participant', status: 'active', joinedAt: daysAgo(43) },

      // Natación (pasado)
      { actId: A.natacion, userId: U.diego, extId: null, alias: null, role: 'host',        status: 'active', joinedAt: daysAgo(22) },
      { actId: A.natacion, userId: U.maria, extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(20) },
      { actId: A.natacion, userId: U.pablo, extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(22) },

      // Paddle (próximo)
      { actId: A.paddle, userId: U.ana,    extId: null, alias: null, role: 'host',        status: 'active', joinedAt: daysAgo(5) },
      { actId: A.paddle, userId: U.carlos, extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(3) },

      // Básquetbol (próximo)
      { actId: A.basket, userId: U.diego, extId: null, alias: null, role: 'host',        status: 'active', joinedAt: daysAgo(3) },
      { actId: A.basket, userId: U.pablo, extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(2) },
      { actId: A.basket, userId: U.maria, extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(1) },

      // Running (próximo)
      { actId: A.running, userId: U.sofia, extId: null, alias: null,     role: 'host',        status: 'active', joinedAt: daysAgo(4) },
      { actId: A.running, userId: U.ana,   extId: null, alias: null,     role: 'participant', status: 'active', joinedAt: daysAgo(2) },
      { actId: A.running, userId: null,    extId: null, alias: 'Andrés', role: 'participant', status: 'active', joinedAt: daysAgo(3) },

      // Tenis individuales (próximo)
      { actId: A.tenisInd, userId: U.carlos, extId: null, alias: null, role: 'host',        status: 'active', joinedAt: daysAgo(5) },
      { actId: A.tenisInd, userId: U.diego,  extId: null, alias: null, role: 'participant', status: 'active', joinedAt: daysAgo(4) },

      // Fútbol 7 (próximo)
      { actId: A.futbol7, userId: U.pablo, extId: null, alias: null,         role: 'host',        status: 'active', joinedAt: daysAgo(7) },
      { actId: A.futbol7, userId: U.sofia, extId: null, alias: null,         role: 'participant', status: 'active', joinedAt: daysAgo(4) },
      { actId: A.futbol7, userId: null,    extId: null, alias: 'Nicolás',    role: 'participant', status: 'active', joinedAt: daysAgo(6) },
      { actId: A.futbol7, userId: null,    extId: null, alias: 'Sebastián',  role: 'participant', status: 'active', joinedAt: daysAgo(6) },
      { actId: A.futbol7, userId: null,    extId: null, alias: 'Mauricio',   role: 'participant', status: 'active', joinedAt: daysAgo(5) },
    ];

    for (const p of parts) {
      await qr.query(
        `INSERT INTO activity_participations
           (id, activity_id, user_id, external_contact_id, alias, role, status, joined_at, confirmed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [uuidv4(), p.actId, p.userId, p.extId, p.alias, p.role, p.status, p.joinedAt, p.role === 'host' || p.userId || p.alias ? p.joinedAt : null, now],
      );
    }

    await qr.commitTransaction();

    console.log('');
    console.log('✅ Seed completado exitosamente');
    console.log('');
    console.log('👤 Usuarios (contraseña: Password123)');
    console.log('   ana@klupni.com     | carlos@klupni.com | sofia@klupni.com');
    console.log('   diego@klupni.com   | maria@klupni.com  | pablo@klupni.com');
    console.log('');
    console.log('📊 Resumen:');
    console.log('   • 6 usuarios verificados con perfiles completos');
    console.log('   • 5 external contacts distribuidos entre usuarios');
    console.log('   • 5 contacts (relación usuario ↔ external contact)');
    console.log('   • 3 actividades pasadas (completed)');
    console.log('   • 5 actividades próximas (open)');
    console.log('   • 26 participaciones activas');

  } catch (err) {
    await qr.rollbackTransaction();
    console.error('❌ Error en el seed:', err);
    throw err;
  } finally {
    await qr.release();
    await ds.destroy();
  }
}

seed();
