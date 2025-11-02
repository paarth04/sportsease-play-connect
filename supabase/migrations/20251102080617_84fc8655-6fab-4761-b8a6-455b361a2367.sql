
-- Insert dummy teams (without specific captain_id references)
INSERT INTO teams (id, name, description, sport, skill_level, max_members)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Thunder Strikers', 'Competitive cricket team looking for skilled players', 'Cricket', 8, 11),
  ('10000000-0000-0000-0000-000000000002', 'FC Warriors', 'Friendly football team, all levels welcome', 'Football', 6, 15),
  ('10000000-0000-0000-0000-000000000003', 'Court Kings', 'Elite basketball squad', 'Basketball', 9, 10),
  ('10000000-0000-0000-0000-000000000004', 'Smash Squad', 'Weekend badminton enthusiasts', 'Badminton', 7, 8),
  ('10000000-0000-0000-0000-000000000005', 'Tennis Titans', 'Professional tennis players seeking tournaments', 'Tennis', 8, 4)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy tournaments (without specific organizer_id references)
INSERT INTO tournaments (id, name, description, sport, start_date, end_date, max_teams, entry_fee, prize_pool, status)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'Mumbai Premier League', 'Annual cricket championship with exciting prizes', 'Cricket', '2025-12-15', '2025-12-20', 16, 5000, 100000, 'upcoming'),
  ('20000000-0000-0000-0000-000000000002', 'City Football Cup', 'Open football tournament for all skill levels', 'Football', '2025-11-20', '2025-11-25', 12, 3000, 50000, 'upcoming'),
  ('20000000-0000-0000-0000-000000000003', 'Hoop Masters Challenge', 'Professional basketball tournament', 'Basketball', '2025-11-10', '2025-11-12', 8, 8000, 150000, 'upcoming'),
  ('20000000-0000-0000-0000-000000000004', 'Badminton Championship', 'State-level badminton competition', 'Badminton', '2025-11-05', '2025-11-07', 16, 2000, 30000, 'upcoming'),
  ('20000000-0000-0000-0000-000000000005', 'Grand Slam Tennis Open', 'Elite tennis tournament for top players', 'Tennis', '2025-11-15', '2025-11-18', 8, 10000, 200000, 'upcoming')
ON CONFLICT (id) DO NOTHING;
