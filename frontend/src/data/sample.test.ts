import sample from './sample.json'

test('sample.json has the expected top-level shape', () => {
  expect(sample.historic.standings.length).toBe(20)
  expect(sample.historic.fc_barcelona_squad.length).toBeGreaterThan(10)
  expect(sample.world_cup_2026.team_metrics.length).toBe(48)
  expect(sample.world_cup_2026.group_standings.length).toBe(12)
  expect(sample.world_cup_2026.group_standings[0].table.length).toBe(4)
})
