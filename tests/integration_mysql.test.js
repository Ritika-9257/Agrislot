const test = require('node:test');
const assert = require('node:assert/strict');
const { testConnection, closePool } = require('../src/config/database');
const MandiRepository = require('../src/repositories/mandi.repository');
const ProduceRepository = require('../src/repositories/produce.repository');
const SlotRepository = require('../src/repositories/slot.repository');

test('Live MySQL Integration Test Suite', async (t) => {
  t.after(async () => {
    await closePool();
  });

  const status = await testConnection();
  if (!status.connected) {
    t.skip('MySQL instance not currently reachable. Skipping live database integration tests.');
    return;
  }

  await t.test('1. Database connectivity check', async () => {
    assert.strictEqual(status.connected, true);
    assert.ok(status.database);
  });

  await t.test('2. Mandis listing returns records', async () => {
    const mandis = await MandiRepository.findAll({ limit: 5 });
    assert.ok(Array.isArray(mandis));
    assert.ok(mandis.length > 0);
    assert.ok(mandis[0].Mandi_Name);
  });

  await t.test('3. Produce catalog returns items and categories', async () => {
    const produce = await ProduceRepository.findAll();
    assert.ok(Array.isArray(produce));
    assert.ok(produce.length > 0);
    assert.ok(['Grains', 'Pulses', 'Fruits', 'Vegetables', 'Oilseeds'].includes(produce[0].Category));
  });

  await t.test('4. Slot capacity availability logic', async () => {
    const slots = await SlotRepository.findAll({ limit: 5 });
    assert.ok(Array.isArray(slots));
    if (slots.length > 0) {
      const slot = slots[0];
      const expectedRemaining = parseFloat(slot.Max_Capacity_Tons) - parseFloat(slot.Booked_Capacity_Tons);
      assert.strictEqual(parseFloat(slot.Remaining_Capacity_Tons), expectedRemaining);
      assert.ok(['Available', 'Full'].includes(slot.Availability_Status));
    }
  });
});
