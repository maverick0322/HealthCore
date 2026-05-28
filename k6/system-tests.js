import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:80';
const API_BASE = `${BASE_URL}/api/v1`;
const tokens = (__ENV.PATIENT_TOKENS || '').split(',').filter(Boolean);
const nutritionistId = __ENV.NUTRI_ID;
const slotId = __ENV.SLOT_ID;
const slotVersion = Number(__ENV.SLOT_VERSION);

const pickRandom = (items) => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};

const buildAvailabilityRange = () => {
  const now = Date.now();
  const from = new Date(now + 24 * 60 * 60 * 1000);
  const to = new Date(now + 7 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

const pickToken = () => {
  if (tokens.length === 0) return '';
  return tokens[Math.floor(Math.random() * tokens.length)];
};

const testType = (__ENV.TEST_TYPE || 'load').toLowerCase();
let stages = [];

switch (testType) {
  case 'load':
    stages = [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ];
    break;
  case 'stress':
    stages = [
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 0 },
    ];
    break;
  case 'spike':
    stages = [
      { duration: '10s', target: 400 },
      { duration: '1m', target: 400 },
      { duration: '10s', target: 0 },
    ];
    break;
  case 'soak':
    stages = [
      { duration: '2m', target: 30 },
      { duration: '30m', target: 30 },
      { duration: '2m', target: 0 },
    ];
    break;
  default:
    stages = [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ];
    break;
}

export const options = {
  stages,
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = pickToken();
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };
  const range = buildAvailabilityRange();
  let dynamicSlot = null;

  group('Validar Sesion', () => {
    const res = http.get(`${API_BASE}/auth/me`, { headers: authHeaders });
    check(res, {
      'auth/me responde 200': (r) => r.status === 200,
    });
    sleep(1);
  });

  group('Consultar Disponibilidad', () => {
    const url = `${API_BASE}/agenda/availability/${nutritionistId}?from=${range.from}&to=${range.to}`;
    const res = http.get(url, { headers: authHeaders });
    check(res, {
      'availability responde 200': (r) => r.status === 200,
    });
    if (res.status === 200) {
      try {
        const data = res.json();
        const candidates = Array.isArray(data)
          ? data
          : Array.isArray(data?.slots)
            ? data.slots
            : [];
        const available = candidates.filter((slot) => slot && slot.id && !slot.reserved && slot.active !== false);
        const picked = pickRandom(available);
        if (picked) {
          dynamicSlot = {
            id: picked.id,
            version: Number.isFinite(picked.version) ? picked.version : slotVersion,
            nutritionistId: picked.nutritionistId || nutritionistId,
          };
        }
      } catch (_) {
        dynamicSlot = null;
      }
    }
    sleep(2);
  });

  group('Crear Cita (Con probabilidad)', () => {
    const slotToUse = dynamicSlot || {
      id: slotId,
      nutritionistId,
      version: slotVersion,
    };
    if (Math.random() < 0.2 && slotToUse.id && slotToUse.nutritionistId && Number.isFinite(slotToUse.version)) {
      const payload = JSON.stringify({
        slotId: slotToUse.id,
        nutritionistId: slotToUse.nutritionistId,
        slotVersion: slotToUse.version,
        locale: 'es-MX',
      });

      const res = http.post(`${API_BASE}/agenda/appointments`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      check(res, {
        'appointment 201 o 409': (r) => r.status === 201 || r.status === 409,
      });
    }

    sleep(1);
  });
}
