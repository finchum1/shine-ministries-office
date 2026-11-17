-- Birthdays on people. Month + day are what matter for "whose birthday is
-- coming up"; the year is optional because plenty of people would rather not
-- share it. Month and day are set together or not at all.
alter table public.people
  add column if not exists birth_month smallint,
  add column if not exists birth_day smallint,
  add column if not exists birth_year smallint;

alter table public.people
  add constraint people_birthday_valid check (
    (birth_month is null and birth_day is null and birth_year is null)
    or (
      birth_month is not null and birth_day is not null
      and birth_month between 1 and 12
      and birth_day between 1 and (case birth_month when 2 then 29 when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30 else 31 end)
      and (birth_year is null or birth_year between 1900 and 2100)
    )
  );
