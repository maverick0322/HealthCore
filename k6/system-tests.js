import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:80';
const API_BASE = `${BASE_URL}/api/v1`;
const tokens = (__ENV.PATIENT_TOKENS || '').split(',').filter(Boolean);
const nutritionistId = __ENV.NUTRI_ID;
const slotId = __ENV.SLOT_ID;
const slotVersion = Number(__ENV.SLOT_VERSION);

const availabilityFrom = '2026-06-01T00:00:00Z';
const availabilityTo = '2026-06-05T23:59:59Z';

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

  group('Validar Sesion', () => {
    const res = http.get(`${API_BASE}/auth/me`, { headers: authHeaders });
    check(res, {
      'auth/me responde 200': (r) => r.status === 200,
    });
    sleep(1);
  });

  group('Consultar Disponibilidad', () => {
    const url = `${API_BASE}/agenda/availability/${nutritionistId}?from=${availabilityFrom}&to=${availabilityTo}`;
    const res = http.get(url, { headers: authHeaders });
    check(res, {
      'availability responde 200': (r) => r.status === 200,
    });
    sleep(2);
  });

  group('Crear Cita (Con probabilidad)', () => {
    if (Math.random() < 0.2 && slotId && nutritionistId && Number.isFinite(slotVersion)) {
      const payload = JSON.stringify({
        slotId,
        nutritionistId,
        slotVersion,
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
