const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:80';
const API_BASE = `${BASE_URL}/api/v1`;
const PASSWORD = process.env.SEED_PASSWORD || 'SecureP@ss123';
const PATIENT_COUNT = Number(process.env.PATIENT_COUNT || 5);

const TIME_ZONE = 'America/Mexico_City';
const SLOT_START_TIME = '09:00';
const SLOT_END_TIME = '13:00';

function formatDateUtc(date) {
  return date.toISOString().slice(0, 10);
}

async function requestJson(path, { method = 'GET', body, token, expected = [200, 201, 204] } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!expected.includes(res.status)) {
    throw new Error(`Request ${method} ${path} failed (${res.status}): ${text}`);
  }

  return data;
}

async function createUser({ email, role }) {
  await requestJson('/auth/register', {
    method: 'POST',
    body: { email, password: PASSWORD, role },
    expected: [201],
  });

  const verification = await requestJson(`/test/auth/verification-code/${encodeURIComponent(email)}`);

  await requestJson('/auth/verify-code', {
    method: 'POST',
    body: { email, code: verification.code },
    expected: [200],
  });

  const login = await requestJson('/auth/login', {
    method: 'POST',
    body: { email, password: PASSWORD },
    expected: [200],
  });

  return login.accessToken;
}

async function seed() {
  console.log('Starting k6 data seed...');

  const runId = Date.now();
  const nutritionistEmail = `k6.nutri.${runId}@healthcore.com`;

  const nutritionistToken = await createUser({
    email: nutritionistEmail,
    role: 'NUTRITIONIST',
  });

  await requestJson('/clinical/nutritionist/profile', {
    method: 'POST',
    token: nutritionistToken,
    body: {
      firstName: 'Jane',
      paternalLastName: 'Smith',
      specializations: ['CLINICAL', 'SPORTS'],
      professionalLicense: '12345678',
      consultationTypes: ['ONLINE'],
      bio: 'Seeded nutritionist for k6 tests.',
    },
    expected: [201, 200],
  });

  const nutritionistProfile = await requestJson('/clinical/nutritionist/profile/me', {
    token: nutritionistToken,
  });
  const nutritionistId = nutritionistProfile.userId;

  const linking = await requestJson('/clinical/linking/generate', {
    method: 'POST',
    token: nutritionistToken,
    expected: [200],
  });
  const linkingCode = linking.code;

  const patientTokens = [];

  const patientNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'];

  for (let i = 0; i < PATIENT_COUNT; i += 1) {
    const patientEmail = `k6.patient.${runId}.${i + 1}@healthcore.com`;
    const patientToken = await createUser({
      email: patientEmail,
      role: 'PATIENT',
    });

    await requestJson('/clinical/profile', {
      method: 'POST',
      token: patientToken,
      body: {
        firstName: patientNames[i] || 'Patient',
        paternalLastName: 'Seed',
        weightKg: 70 + i,
        heightCm: 170 + i,
        birthDate: '1995-05-20',
        gender: 'MALE',
        activityLevel: 'MODERATELY_ACTIVE',
        goal: 'health',
        dietType: 'omnivore',
      },
      expected: [201, 200],
    });

    await requestJson('/clinical/linking/connect', {
      method: 'POST',
      token: patientToken,
      body: { code: linkingCode },
      expected: [200, 201, 204],
    });

    patientTokens.push(patientToken);
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() + 1);
  const startDateStr = formatDateUtc(startDate);

  const slots = await requestJson('/agenda/nutritionist/slots/generate', {
    method: 'POST',
    token: nutritionistToken,
    body: {
      timeZone: TIME_ZONE,
      durationMinutes: 30,
      startDate: startDateStr,
      endDate: startDateStr,
      startTime: SLOT_START_TIME,
      endTime: SLOT_END_TIME,
      days: [
        {
          date: startDateStr,
          blocks: [{ startTime: SLOT_START_TIME, endTime: SLOT_END_TIME }],
        },
      ],
    },
    expected: [201],
  });

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new Error('Slot generation returned an empty list.');
  }

  const targetSlot = slots[0];

  const envVars = [
    `NUTRI_ID=${nutritionistId}`,
    `SLOT_ID=${targetSlot.id}`,
    `SLOT_VERSION=${targetSlot.version}`,
    `PATIENT_TOKENS=${patientTokens.join(',')}`,
  ].join('\n') + '\n';

  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, envVars);
  } else {
    console.log('Generated variables (local):');
    console.log(envVars);
  }

  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
