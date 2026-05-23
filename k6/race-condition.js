import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

export const options = {
  scenarios: {
    colision_de_citas: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 1,
      maxDuration: '10s',
    },
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:80';
const slotId = __ENV.SLOT_ID;
const nutritionistId = __ENV.NUTRI_ID;
const slotVersion = Number(__ENV.SLOT_VERSION);
const tokens = (__ENV.PATIENT_TOKENS || '').split(',').filter(Boolean);

const createdCount = new Counter('appointment_created');
const conflictCount = new Counter('appointment_conflict');

export default function () {
  const myToken = tokens[__VU - 1];
  const url = `${baseUrl}/api/v1/agenda/appointments`;

  const payload = JSON.stringify({
    slotId,
    nutritionistId,
    slotVersion,
    locale: 'es-MX',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${myToken}`,
    },
  };

  const res = http.post(url, payload, params);

  if (res.status === 201) {
    createdCount.add(1);
  } else if (res.status === 409) {
    conflictCount.add(1);
  }

  if (res.status !== 201 && res.status !== 409) {
    console.log(`Unexpected status=${res.status} body=${res.body}`);
  }

  check(res, {
    'Transaccion exitosa o bloqueo correcto (201 o 409)': (r) => r.status === 201 || r.status === 409,
  });
}

export function handleSummary(data) {
  const created = data.metrics.appointment_created?.values?.count ?? 0;
  const conflicts = data.metrics.appointment_conflict?.values?.count ?? 0;
  return {
    stdout: `\nAppointment results: 201=${created} 409=${conflicts}\n`,
  };
}
