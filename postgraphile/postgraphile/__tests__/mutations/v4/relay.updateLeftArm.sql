update "c"."left_arm" as __left_arm__ set "length_in_metres" = $1::"float8", "person_id" = $2::"int4" where (__left_arm__."id" = $3::"int4") returning
  __left_arm__."id"::text as "0",
  __left_arm__."person_id"::text as "1",
  __left_arm__."length_in_metres"::text as "2",
  __left_arm__."mood" as "3";

select
  __person__."id"::text as "0"
from "c"."person" as __person__
where (
  __person__."id" = $1::"int4"
);