---
title: 실제로 네 번 호출해 보니, 합치려던 테이블을 다시 나눴다
description: 서비스키를 받아 명세서의 네 오퍼레이션을 전부 실제로 호출해 봤다. 명세서와 달랐던 점, 그리고 2편의 설계를 바꾼 이유를 적는다.
date: 2026-11-15
kind: note
category: 데이터베이스
tags: [공공API, 테이블설계, 설계]
ai:
  design: Claude Sonnet 5
  note: 실제 호출 결과를 두고 테이블을 나눌지 합칠지 다시 따진 과정은 Claude와 대화하며 정리했다.
series:
  id: smartfarm-replay
  order: 4
---

[1편](/posts/smartfarm-01-api-spec/)의 마지막에 "첫 호출로 확인할 것" 목록을 남겼다. 서비스키를 발급받아 네 오퍼레이션(작기 목록, 환경, 제어, 생육)을 전부 실제로 호출해 봤다. 이 글은 그 결과와, 그 결과 때문에 [2편](/posts/smartfarm-02-table-design/)의 설계를 하나 바꾼 이야기다.

## 호출 결과는 명세서와 거의 일치했다

실제 작기(파프리카, croppingSerlNo 7535) 하나로 네 오퍼레이션을 다 불러봤다.

- 환경정보 응답의 `sectCode`/`fatrCode` 조합(예: `EL`/`EL` = 토양EC, `NT`/`BW` = 배지무게)이 별첨 항목코드표와 정확히 일치했다.
- 생육정보(`getCultivateDataList`) 필드(`examinIemCode`, `examinIemNm`, `examinIemValue`, `examinIemUnit`)도 명세서 그대로였다.

1편에서 적어둔 "확인할 것" 중 두 가지도 답이 나왔다.

| 확인할 것 | 답 |
| --- | --- |
| 시설 ID 필드명이 facilityId인가 fcltyId인가 | 둘 다 맞았다. 작기·환경·제어 오퍼레이션은 `facilityId`, 생육 오퍼레이션만 `fcltyId`를 쓴다. 명세서와 안내 페이지가 서로 다른 오퍼레이션을 기준으로 적혀 있었던 것 같다. |
| 전체 페이지 수를 믿을 수 있는가 | 못 믿는다. 환경정보에서 `totalRows: 33435`인데 `totalPage: "33.0"`이 왔다. 1,000건씩이면 34페이지여야 한다. 1편에서 세운 "1,000건 미만이 올 때까지 다음 페이지를 요청한다"는 방침이 맞았다. |

명세서에 없던 것도 하나 나왔다. 생육정보(`getCultivateDataList`)는 애초에 `pageNum` 파라미터가 없다. 작기 하나의 생육기록을 페이지 없이 통째로 돌려준다. 표본이 많은 작기면 응답이 커질 수 있다는 뜻이라, 수집기를 만들 때 타임아웃을 넉넉히 잡아야 한다.

## 2편에서 합치기로 한 테이블을 다시 나눴다

2편에서는 환경과 제어를 하나의 `measurement` 테이블에 담기로 했다. 명세서상 두 응답의 컬럼이 완전히 같다는 게 이유였다.

실제로 받아보니 컬럼이 같다는 건 여전히 맞았다. 그런데 같은 작기에서 건수가 이랬다.

- 환경정보: 33,435건
- 제어정보: 3,694건

9배 차이다. 같은 기간, 같은 농가인데 센서값은 거의 쉴 새 없이 쌓이고 제어는 그보다 훨씬 드물게 일어난다는 뜻이다. 테이블을 합치면 이 두 성격이 다른 쓰기 패턴이 한곳에 섞여서, 나중에 인덱스나 파티셔닝을 따로 가져가고 싶어져도 테이블 하나를 어정쩡하게 쪼개 써야 한다.

컬럼이 같다는 건 "같은 모양으로 응답이 온다"는 뜻이지 "같은 종류의 데이터"라는 뜻은 아니었다. `sectCode`가 이미 환경(EI/EL/EO/NT)과 제어(CR)를 공식적으로 구분하고 있고, 두 데이터를 쓰는 목적도 다르다. 환경은 재생 화면에 쭉 흘려보낼 시계열이고, 제어는 나중에 만들 "LLM이 이렇게 하라고 했으면 실제로는 어떻게 했나"를 대조하는 기준값이다. 그래서 `env_record`와 `control_record`로 나누기로 했다.

```sql
create table env_record (
  cropping_serl_no integer    not null references cropping_season,
  measured_at      timestamp  not null,
  sect_code        varchar(2) not null,   -- EI, EO, EL, NT
  fatr_code        varchar(20) not null,
  value            numeric(14,4),
  collect_count    integer,
  primary key (cropping_serl_no, measured_at, sect_code, fatr_code)
);

create table control_record (
  cropping_serl_no integer    not null references cropping_season,
  measured_at      timestamp  not null,
  fatr_code        varchar(20) not null,  -- sect_code는 항상 CR이라 컬럼에서 뺐다
  value            numeric(14,4),
  collect_count    integer,
  primary key (cropping_serl_no, measured_at, fatr_code)
);
```

2편에서 쓴 PK 설계(대리키 없이 복합키, timestamp를 시간대 없이 저장하는 것, 코드표에 외래키를 걸지 않는 것)는 그대로 둘 다에 적용된다. 바뀐 건 "하나냐 둘이냐"뿐이다.

## 남은 일

이제 이 네 테이블(작기, 환경, 제어, 생육)에 더해, LLM이 환경값을 보고 내린 판단과 실제 제어기록을 대조하는 테이블을 설계할 차례다. 이건 명세서에 없는, 이 프로젝트에서 새로 만들어야 하는 부분이라 다음 글에서 따로 다룬다.
