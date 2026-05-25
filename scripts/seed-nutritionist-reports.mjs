const config = {
  gatewayBaseUrl: (process.env.HEALTHCORE_GATEWAY_URL ?? 'http://localhost').replace(/\/$/, ''),
  nutritionistEmail: process.env.REPORT_SEED_NUTRITIONIST_EMAIL ?? 'testnutri10@gmail.com',
  password: process.env.REPORT_SEED_PASSWORD ?? 'JUNKlolgamer+5',
  patientCount: Number(process.env.REPORT_SEED_PATIENT_COUNT ?? '6'),
  patientStartIndex: Number(process.env.REPORT_SEED_PATIENT_START_INDEX ?? '101'),
  locale: process.env.REPORT_SEED_LOCALE ?? 'es-MX',
};

const apiBaseUrl = `${config.gatewayBaseUrl}/api/v1`;

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const logStep = (message) => {
  console.log(`\n[reports-seed] ${message}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, { method = 'GET', token, body, expected = [200] } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!expected.includes(response.status)) {
    let details = '';
    try {
      details = await response.text();
    } catch {
      details = '';
    }

    const error = new Error(
      `Request ${method} ${path} failed with ${response.status}${details ? ` - ${details}` : ''}`
    );
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text);
}

async function ensureRegisteredUser(email, password, role) {
  try {
    await request('/auth/register', {
      method: 'POST',
      body: { email, password, role, locale: config.locale },
      expected: [200, 201],
    });
    console.log(`  created user ${email}`);
  } catch (error) {
    if (error.status === 409) {
      console.log(`  reusing existing user ${email}`);
    } else {
      throw error;
    }
  }

  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    expected: [200],
  });

  return loginResponse.accessToken;
}

async function getOrNull(path, token) {
  try {
    return await request(path, { token, expected: [200] });
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

function toIsoDateTime(date) {
  return new Date(date).toISOString();
}

function addDaysUtc(baseDate, amount, hour = 12) {
  return new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate() + amount,
    hour,
    0,
    0
  ));
}

async function ensureNutritionistProfile(token) {
  const existingProfile = await getOrNull('/clinical/nutritionist/profile/me', token);
  if (existingProfile) {
    return existingProfile;
  }

  const payload = {
    firstName: 'Test',
    paternalLastName: 'Nutriologo',
    maternalLastName: 'Reportes',
    specializations: ['CLINICAL'],
    customSpecialization: '',
    professionalLicense: '1234567',
    consultationTypes: ['ONLINE'],
    phone: '',
    clinicAddress: null,
    bio: 'Perfil de prueba para validar reportes operativos',
  };

  await request('/clinical/nutritionist/profile', {
    method: 'POST',
    token,
    body: payload,
    expected: [200],
  });

  return request('/clinical/nutritionist/profile/me', { token, expected: [200] });
}

async function ensurePatientProfile(token, index) {
  const existingProfile = await getOrNull('/clinical/profile/me', token);
  const patientNames = ['Paula', 'Carlos', 'Lucia', 'Mateo', 'Sofia', 'Diego', 'Elena', 'Jorge'];
  const paternalNames = ['Ramirez', 'Torres', 'Lopez', 'Mendoza', 'Herrera', 'Navarro'];
  const maternalNames = ['Garcia', 'Flores', 'Vega', 'Cruz', 'Salazar', 'Morales'];
  const payload = {
    firstName: patientNames[index % patientNames.length],
    paternalLastName: paternalNames[index % paternalNames.length],
    maternalLastName: maternalNames[index % maternalNames.length],
    weightKg: 82 - index % 7,
    heightCm: 165 + (index % 5) * 3,
    birthDate: '1995-05-15',
    gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
    activityLevel: index % 2 === 0 ? 'LIGHTLY_ACTIVE' : 'MODERATELY_ACTIVE',
    goal: 'health',
    dietType: 'omnivore',
    allergies: [],
    excludedFoods: [],
  };

  if (!existingProfile) {
    await request('/clinical/profile', {
      method: 'POST',
      token,
      body: payload,
      expected: [200],
    });
    return;
  }

  await request('/clinical/profile/me', {
    method: 'PUT',
    token,
    body: payload,
    expected: [200],
  });
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildWeightTimeline(index) {
  const today = new Date();
  const currentWeight = 76 - (index % 5);

  return [
    { date: toDateKey(addDaysUtc(today, -320)), weightKg: Number((currentWeight + 6.5).toFixed(1)) },
    { date: toDateKey(addDaysUtc(today, -150)), weightKg: Number((currentWeight + 4.5).toFixed(1)) },
    { date: toDateKey(addDaysUtc(today, -60)), weightKg: Number((currentWeight + 2.5).toFixed(1)) },
    { date: toDateKey(addDaysUtc(today, -20)), weightKg: Number((currentWeight + 1.0).toFixed(1)) },
    { date: toDateKey(addDaysUtc(today, -2)), weightKg: Number(currentWeight.toFixed(1)) },
  ];
}

async function getWeightHistory(token) {
  return request('/clinical/weight/history', {
    token,
    expected: [200],
  });
}

async function seedPatientWeightHistory(token, index) {
  const desiredTimeline = buildWeightTimeline(index);
  const existingHistory = await getWeightHistory(token);
  const sortedHistory = [...existingHistory].sort((left, right) => left.date.localeCompare(right.date));

  for (let i = sortedHistory.length - 1; i >= 1; i -= 1) {
    await request(`/clinical/weight/${encodeURIComponent(sortedHistory[i].date)}`, {
      method: 'DELETE',
      token,
      expected: [200],
    });
  }

  const remainingHistory = await getWeightHistory(token);
  const baseRecord = remainingHistory[0];

  await request(`/clinical/weight/${encodeURIComponent(baseRecord.date)}`, {
    method: 'PUT',
    token,
    body: {
      weightKg: desiredTimeline[0].weightKg,
      date: desiredTimeline[0].date,
    },
    expected: [200],
  });

  for (let i = 1; i < desiredTimeline.length; i += 1) {
    await request('/clinical/weight', {
      method: 'POST',
      token,
      body: {
        weightKg: desiredTimeline[i].weightKg,
        date: desiredTimeline[i].date,
      },
      expected: [200],
    });
  }
}

async function ensureLinkedToNutritionist(nutritionistToken, patientToken) {
  try {
    await request('/clinical/linking/disconnect/patient', {
      method: 'POST',
      token: patientToken,
      body: {},
      expected: [200],
    });
    await sleep(100);
  } catch (error) {
    if (![404, 409].includes(error.status)) {
      throw error;
    }
  }

  const linkingCode = await request('/clinical/linking/generate', {
    method: 'POST',
    token: nutritionistToken,
    body: {},
    expected: [200],
  });

  await request('/clinical/linking/connect', {
    method: 'POST',
    token: patientToken,
    body: { code: linkingCode.code },
    expected: [200],
  });
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

function buildSlotDays(baseDate) {
  return [0, 1].map((offset) => ({
    date: toDateKey(addDays(baseDate, offset)),
    blocks: [
      { startTime: '09:00', endTime: '12:30' },
    ],
  }));
}

async function generateSlotsWithRetry(nutritionistToken) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const baseDate = addDays(new Date(), 30 + attempt * 30);
    const payload = {
      timeZone: 'America/Mexico_City',
      durationMinutes: 30,
      days: buildSlotDays(baseDate),
    };

    try {
      await request('/agenda/nutritionist/slots/generate', {
        method: 'POST',
        token: nutritionistToken,
        body: payload,
        expected: [201],
      });
      return {
        from: new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0)).toISOString(),
        to: new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() + 3, 0, 0, 0)).toISOString(),
      };
    } catch (error) {
      if (error.status !== 409) {
        throw error;
      }
    }
  }

  throw new Error('No fue posible generar slots unicos para el seed de reportes');
}

async function bookAppointments(patients, availabilityWindow, nutritionistId) {
  const bookedAppointments = [];
  const usedSlotIds = new Set();

  for (const patient of patients) {
    const availability = await request(
      `/agenda/availability/${encodeURIComponent(nutritionistId)}?from=${encodeURIComponent(availabilityWindow.from)}&to=${encodeURIComponent(availabilityWindow.to)}`,
      {
        token: patient.token,
        expected: [200],
      }
    );

    const slot = availability.find((candidate) => !usedSlotIds.has(candidate.id));
    if (!slot) {
      throw new Error(`No encontramos un slot libre para ${patient.email}`);
    }

    usedSlotIds.add(slot.id);
    const appointment = await request('/agenda/appointments', {
      method: 'POST',
      token: patient.token,
      body: {
        slotId: slot.id,
        nutritionistId,
        slotVersion: slot.version,
        locale: config.locale,
      },
      expected: [201],
    });

    bookedAppointments.push({
      ...patient,
      appointmentId: appointment.id,
    });
  }

  return bookedAppointments;
}

function buildReportingAppointmentTimeline() {
  const today = new Date();
  return [
    { startTime: addDaysUtc(today, -10, 15), status: 'ATTENDED' },
    { startTime: addDaysUtc(today, -18, 16), status: 'CANCELLED' },
    { startTime: addDaysUtc(today, -45, 15), status: 'ATTENDED' },
    { startTime: addDaysUtc(today, -80, 16), status: 'CANCELLED' },
    { startTime: addDaysUtc(today, -170, 15), status: 'ATTENDED' },
    { startTime: addDaysUtc(today, -320, 16), status: 'ATTENDED' },
  ];
}

function buildArchiveAppointmentStart(index) {
  const today = new Date();
  return addDaysUtc(today, -(430 + index * 3), 12 + (index % 4));
}

async function getPatientAppointmentsForNutritionist(token, nutritionistId) {
  const today = new Date();
  const from = toIsoDateTime(addDaysUtc(today, -730));
  const to = toIsoDateTime(addDaysUtc(today, 365));
  const history = await request(
    `/agenda/appointments/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&statuses=${encodeURIComponent('PENDING,CONFIRMED,CANCELLED,ATTENDED')}`,
    {
      token,
      expected: [200],
    }
  );

  return history.filter((appointment) => appointment.nutritionistId === nutritionistId);
}

async function ensureSeedAppointments(patients, availabilityWindow, nutritionistId) {
  const seededAppointments = [];
  const patientsMissingAppointments = [];

  for (const patient of patients) {
    const existingAppointments = await getPatientAppointmentsForNutritionist(patient.token, nutritionistId);
    if (existingAppointments.length > 0) {
      seededAppointments.push({
        ...patient,
        appointmentId: existingAppointments[0].id,
        extraAppointmentIds: existingAppointments.slice(1).map((appointment) => appointment.id),
      });
      continue;
    }

    patientsMissingAppointments.push(patient);
  }

  if (patientsMissingAppointments.length > 0) {
    const newlyBookedAppointments = await bookAppointments(
      patientsMissingAppointments,
      availabilityWindow,
      nutritionistId
    );
    seededAppointments.push(
      ...newlyBookedAppointments.map((appointment) => ({
        ...appointment,
        extraAppointmentIds: [],
      }))
    );
  }

  return seededAppointments;
}

async function applyReportingAdjustments(nutritionistToken, appointments) {
  const desiredTimeline = buildReportingAppointmentTimeline();
  const payload = {
    appointments: [
      ...appointments.slice(0, desiredTimeline.length).map((appointment, index) => ({
        appointmentId: appointment.appointmentId,
        startTime: desiredTimeline[index].startTime.toISOString(),
        endTime: new Date(desiredTimeline[index].startTime.getTime() + 30 * 60 * 1000).toISOString(),
        status: desiredTimeline[index].status,
      })),
      ...appointments.flatMap((appointment, appointmentIndex) =>
        appointment.extraAppointmentIds.map((appointmentId, extraIndex) => {
          const archivedStart = buildArchiveAppointmentStart(appointmentIndex * 10 + extraIndex);
          return {
            appointmentId,
            startTime: archivedStart.toISOString(),
            endTime: new Date(archivedStart.getTime() + 30 * 60 * 1000).toISOString(),
            status: 'CANCELLED',
          };
        })
      ),
    ],
  };

  return request('/agenda/nutritionist/dev/appointments/reporting-adjustments', {
    method: 'POST',
    token: nutritionistToken,
    body: payload,
    expected: [200],
  });
}

async function main() {
  logStep(`using gateway ${config.gatewayBaseUrl}`);

  const nutritionistToken = await ensureRegisteredUser(
    config.nutritionistEmail,
    config.password,
    'NUTRITIONIST'
  );
  const nutritionistProfile = await ensureNutritionistProfile(nutritionistToken);

  const patients = [];
  for (let offset = 0; offset < config.patientCount; offset += 1) {
    const index = config.patientStartIndex + offset;
    const email = `testpac${index}@gmail.com`;
    const token = await ensureRegisteredUser(email, config.password, 'PATIENT');
    await ensurePatientProfile(token, index);
    await seedPatientWeightHistory(token, offset);
    await ensureLinkedToNutritionist(nutritionistToken, token);
    patients.push({ email, token });
    console.log(`  patient ready ${email}`);
  }

  const slotWindow = await generateSlotsWithRetry(nutritionistToken);
  const bookedAppointments = await ensureSeedAppointments(
    patients,
    slotWindow,
    nutritionistProfile?.userId ?? config.nutritionistEmail
  );

  try {
    const adjustmentResponse = await applyReportingAdjustments(nutritionistToken, bookedAppointments);
    logStep(`reporting adjustments applied to ${adjustmentResponse.updatedCount} appointments`);
  } catch (error) {
    if (error.status === 404 || error.status === 403) {
      throw new Error(
        'No fue posible aplicar los ajustes de agenda para reportes. Verifica que agenda-service esté levantado con AGENDA_DEV_TOOLS_ENABLED=true'
      );
    }
    throw error;
  }

  logStep('seed finished successfully');
  console.table(
    bookedAppointments.map((appointment) => ({
      patient: appointment.email,
      appointmentId: appointment.appointmentId,
    }))
  );
  console.log('\nPuedes iniciar sesión con:');
  console.log(`  nutriologo: ${config.nutritionistEmail}`);
  console.log(`  password:   ${config.password}`);
}

main().catch((error) => {
  console.error('\n[reports-seed] failed');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
