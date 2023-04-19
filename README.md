# buyself-backend

# 상품 리스트 페이지에 cache적용과 k6를 이용한 성능테스트에 대한 기록

## 그런데 나는 대체 왜 전체 상품 리스트를 반환하는 Controller에 pagination과 cache를 적용할려 했을까?

### pagination을 이용한 인덱스를 생성하면 뭐가 좋은가?

- 페이지 번호와 함께 인덱스를 사용하면, SQL 쿼리에서 LIMIT 및 OFFSET을 사용하여 현재 페이지에 표시되는 상품 데이터를 추출할 수 있습니다. 이를 통해 전체 상품 데이터를 모두 추출하지 않고도 현재 페이지의 상품 데이터만 추출할 수 있으므로, 데이터베이스의 부하를 줄이고 응답 시간을 단축할 수 있습니다.

**pagination의 장점은?**

- 페이지네이션 UI에서 사용자가 현재 어떤 페이지를 보고 있는지를 파악하기 쉬워집니다. 사용자가 명확하게 현재 페이지를 알면, 다음 페이지나 이전 페이지로 이동하기가 더 쉬워져서 사용자 경험을 개선할 수 있습니다.

**결론**

- 따라서, 전체 상품 데이터 리스트에 pagination을 이용한 인덱스를 사용하면, 데이터베이스의 부하를 줄이고 응답 시간을 단축 할 수 있으며, 사용자의 UX가 향상됩니다.

### 우리는 어떤 데이터를 캐싱해야할까?

- **업데이트가 자주 발생하지 않는 데이터**
    - 잦은 업데이트가 발생하는 데이터를 캐싱한다면 업데이트가 발생할 때마다 DB의 데이터와 캐시 데이터의 정합성을 맞추는 작업을 실시해야 하기 때문에 오히려 성능에 악영향을 줄 수 있다.
- **자주 조회되는 데이터를 사용한다.**
    - 조회 요청이 거의 없는 데이터를 캐싱한다면 그저 메모리만 낭비하는 데이터가 될 수 있으며, 조회시에도 본 스토리지에 요청을 보내기 전 캐시에 데이터가 존재하는지 확인해야하는 작업을 거치기 때문에 오히려 조회 속도가 더 느려질 수 있다.
    
**결론**

- *전체 상품 데이터를 반환하는 리스트는 사용자에게 자주 조회되는 데이터이고 업데이트가 상대적으로 자주 발생하지 않다고 판단되어 cache를 적용하는 것이 좋다고 생각되었다.*


|  | 데이터 수 | 캐시 적용 여부  | 인덱스 적용 여부 | postman 응답 시간 | 총 페이지 /한 페이지당 반환 개수 |
| --- | --- | --- | --- | --- | --- |
| 실험1 | 500,000 | X | X | 29.43s | 1/50만 |
| 실험2 | 500,000 | O | X | 19.97s | 1/50만 |
| 실험3 | 500,000 | X | O | 193ms | 400/80 |
| 실험4 | 500,000 | O | O | 31ms | 400/80 |

***표 해석***

- pagination을 적용해도 데이터의 개수(50만)가 많다 보니 cache를 적용하지 않았을 때와 했을 때의 차이는 꽤 났다. (193ms → 31ms) 193ms가 적지 않은 시간이라고 생각할 수 있지만 193ms의 시간이 다른 데이터를 응답 받기 위한 이전의 응답시간이라면 사용자의 서비스 이용 시간에 대한 만족도는 그리 높지 않을 것이라고 생각했다.
- 대용량의 데이터에  캐시와 인덱스 모두 적용하여  응답 시간을 개선 시킬 수 있었다.
    - *29.43s → 19.97s → 193ms → 31ms*
- 현재 서비스의 데이터는 23개뿐이라 pagination과 cache를 이용한 응답속도의 감소는 체감이 덜하다고 느꼈지만 50만 데이터같은 대용량을 넣어보고 cache와 pagination을 적용 전/후로 응답속도를 확인해보니 확실히 필요성을 느낄 수 있었다.

# K6 부하테스트 
방법 : brew install k6(k6설치) → k6 run script.js(실행)

```jsx
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
     let page = Math.floor(Math.random() * 400) + 1; //  1부터 400 사이의 랜덤 페이지 생성

    http.get(`http://localhost:5000/api/products?page=${page}`);
    sleep(1); // sleep while a second  /  sleep() 함수를 사용하여 API를 호출하는 각각의 요청을 1초씩 지연
}
```

모든 실험에는 100명의 유저가 30초동안 상품리스트 페이지를 1~400page 혹은 1~5000page까지 랜덤으로 들어가게 하였으며 데이터의 개수는 50만 혹은 3만2천이다. pagination을 이용한 자동 인덱스 생성은 적용된 상태로, 캐시의 적용 전/후 성능 테스트를 시도해보았다.


|  | 데이터 수 | 캐시 적용 여부  | 인덱스 적용 여부 | k6/http_req_duration | 총 페이지 /한 페이지당 반환 개수 |
| --- | --- | --- | --- | --- | --- |
| 실험1-1 | 500,000 | X | O | 10.87s | 5000/100 |
| 실험1-2 | 500,000 | O | O | 10.8s | 5000/100 |
| 실험2-1 | 500,000 | X | O | 4.13s | 400/80 |
| 실험2-2 | 500,000 | O | O | 35.55ms | 400/80 |
| 실험3-1 | 32,000 | X | O | 769.76ms | 400/80 |
| 실험3-2 | 32,000 | O | O | 47.24ms | 400/80 |

***표 해석***

- 실험 1-1, 1-2를 봤을 때 random 한 총 페이지의 개수가 너무 많으면 캐시의 적중률이 너무 떨어져 캐시의 효과가 없다. **즉, 캐시의 적중률이 너무 낮은 데이터에는 캐시를 적용하는 의미가 없다.**
- 실험2-1과 실험 3-1를 비교해봤을 때 데이터의 양만 50만개로 많아지면(캐시를 적용안 했을 때) http_req_duration의 값은 차이가 많이 놨다.  **769.76ms → 4.13s 따라서 데이터의 양이 많아질 수록 적절한 데이터에 캐시는 필수라고 생각했다.**
- 데이터의 양이 많아지더라도 캐시의 적중률은 random이기에 실험2-2과 실험3-2은의 http_req_duraton은 차이가 났다.


# 각 성능 테스트를 위해 다시 데이터를 3만 2천개로 남겨두기로 했다.

데이터의 수가 50만에 총 페이지/한 페이지당 반환 개수를 5000/100으로 하면 캐시의 적중률이 낮아 성능 테스트를 하는 의미가 없다고 생각했고 50만 데이터여도 400/80으로 하면 모든 데이터를 사용자에게 응답 해줄 수 있는 것이 아니기에 의미가 없다 생각했다. 따라서 지금부터 각 성능테스트는 실험 3-2의 

(데이터수 : 32,000 / 캐시 적용 여부 : O / 인덱스 적용 여부 : O / 총 페이지, 페이지당 반환 개수 : 400/80)스펙으로 하겠다.

```bash
create
    definer = junsu1222@`%` procedure KeepTop32000()
BEGIN
    DELETE t1
    FROM junsu_project_v2.products t1
    LEFT JOIN (
        SELECT id
        FROM junsu_project_v2.products
        ORDER BY id
        LIMIT 32000
    ) t2 ON t1.id = t2.id
    WHERE t2.id IS NULL;
END;
```

# K6 공식 홈페이지에 나와있는 Test Type으로 성능 테스트를 해보겠다.
<img width="849" alt="1" src="https://user-images.githubusercontent.com/97604953/232984871-4ef7ed4d-71fe-4927-8510-74e44834e6ba.png">



## Smoke Testing

- 시스템이 문제 없이 최소한의 로드를 처리할 수 있는지 확인합니다.

```jsx
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: '1m',

  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  let res = http.get(`http://localhost:5000/api/products?page=${page}`);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1)
}
```

사용자 한명이 1분동안 api 요청, http_req_duration의 99%가 1.5s 아래여야 한다.

<img width="952" alt="2" src="https://user-images.githubusercontent.com/97604953/232984910-bdee1555-bbc7-4508-809f-5508431e2eab.png">


## Load Testing

- 동시 사용자 또는 초당 요청 측면에서 시스템 성능을 평가합니다.

```jsx
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 100 }, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes.
    { duration: '10m', target: 100 }, // stay at 100 users for 10 minutes
    { duration: '5m', target: 0 }, // ramp-down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  let res = http.get(`http://localhost:5000/api/products?page=${page}`);
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
```

5분동안 사용자가 점차적으로 100명으로 상승 → 10분동안 100명 유지 → 5분동안 0명으로 점차 감소

<img width="929" alt="3" src="https://user-images.githubusercontent.com/97604953/232984947-a3ba1e4b-2a26-4f24-88ef-25e8cfad6bab.png">

<img width="1654" alt="123" src="https://user-images.githubusercontent.com/97604953/232985476-565c8b02-46c2-4c8d-822f-994cb76d7132.png">


## Stress Testing

- 과부하 상태에서 시스템의 가용성과 안정성을 평가하는 것입니다 .
    - 극한 조건에서 시스템이 작동하는 방식.
    - 사용자 또는 처리량 측면에서 시스템의 최대 용량은 얼마입니까?
    - 시스템의 한계점과 장애 모드는 무엇입니까?
    - 스트레스 테스트가 끝난 후 수동 개입 없이 시스템이 복구되는지 여부.

```jsx
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-arrival-rate",
      preAllocatedVUs: 500,
      timeUnit: "1s",
      stages: [
        { duration: "2m", target: 10 }, // below normal load
        { duration: "5m", target: 10},
        { duration: "2m", target: 20 }, // normal load
        { duration: "5m", target: 20 },
        { duration: "2m", target: 30 }, // around the breaking point
        { duration: "5m", target: 30 },
        { duration: "2m", target: 40 }, // beyond the breaking point
        { duration: "5m", target: 40 },
        { duration: "10m", target: 0 }, // scale down. Recovery stage.
      ],
    },
  },
};

export default function () {
  let page = Math.floor(Math.random() * 400) + 1;
  const BASE_URL = `http://localhost:5000/api/products?page=${page}`
  const responses = http.batch([
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}`],
  ]);
}
```
<img width="1120" alt="123" src="https://user-images.githubusercontent.com/97604953/232985672-7f50efe5-a175-40c7-9fd5-68929d0c50c9.png">
<img width="1653" alt="1234" src="https://user-images.githubusercontent.com/97604953/232985683-9725cfc2-5323-40c0-a88d-cbec2080155b.png">



http_req_failed가 0.06%가 나왔다. 적은 수치라 생각하지만 0.00%가 되기 위해서는 서버 측의 리소스를 늘리거나 스케일 업/아웃 등의 조치로 해결 할 수도 있겠다 생각했다.

- 스케일 업은 서버 자체의 하드웨어 성능을 높이는 방법입니다. 이는 일반적으로 프로세서, 메모리, 디스크 용량 등을 추가하거나 업그레이드하는 것을 의미합니다. 이 방법은 단일 서버로 동작하는 경우에 적합합니다.
- 스케일 아웃은 서버를 여러 대 추가하여 작업을 분산하는 방법입니다. 즉, 여러 대의 서버가 네트워크를 통해 일을 분담하도록 하는 것입니다. 이 방법은 여러 대의 서버가 필요하거나 고가용성 및 수평 확장성이 필요한 경우에 적합합니다.

**내가 선택한 방식은 코드 리펙토링이다.**

상품 검색 API를 설계할 때 Full Text Search로 구현하기위해 elasticsearch를 이용하였다. 이때 elasticsearch에 더미 데이터를 넣는 inputData()함수를 전체 상품 조회 API앞에 넣어놨었다. 이유는 첫 검색 Request를 보내면 inputData()가 실행이 안되고 2번째 Request를 보내야 inputData()가 실행되어 알맞은 데이터의 응답을 확인할 수 있었다. 첫 요청을 보넬때 더미 데이터가 다 안들어가진 상태에서 응답을 보네주어서 그런것 같았다. 따라서 inputData()를 첫 상품 리스트 페이지 요청과 함께 실행되도록 넣어 놓았는데 이러면 상품 페이지를 두 번째 Request 할때마다 inputData()를 호출하여 의미없는 함수 요청을 계속하게 되었다. inputData()를 애플리케이션 시작할 때 한번만 호출하도록 바꾸었다.

## Stress Testing-2

<img width="1009" alt="123" src="https://user-images.githubusercontent.com/97604953/232985806-c21742b6-05a2-45ee-b8b0-0167891a253b.png">

<img width="1666" alt="1234" src="https://user-images.githubusercontent.com/97604953/232985822-41548056-3484-4c45-ac7b-1f789d5d47dc.png">

<img width="1636" alt="12345" src="https://user-images.githubusercontent.com/97604953/232985831-1098f994-5a7f-4e97-a11c-7aaa0d8b6801.png">


의미 없는 함수의 호출을 계속 반복하지 않고 애플리케이션 시작할 때 한번만 하게 리펙토링 한 것만으로도 Stress Testing을 잘 수행 할 수 있었다.

## Spike Test

- 극심한 부하 급증으로 시스템을 즉시 압도하는 일종의 스트레스 테스트입니다.
    - 갑작스러운 트래픽 급증 시 시스템이 어떻게 작동하는지.
    - 트래픽이 감소한 후 시스템이 복구되는지 여부를 판단
    
    ```jsx
    import http from "k6/http";
    import { check } from 'k6';
    
    export const options = {
      scenarios: {
        spike: {
          executor: "ramping-arrival-rate",
          preAllocatedVUs: 1000,
          timeUnit: "1s",
          stages: [
            { duration: "10s", target: 10 }, // below normal load
            { duration: "1m", target: 10 },
            { duration: "10s", target: 100 }, // spike to 140 iterations
            { duration: "3m", target: 100 }, // stay at 140 for 3 minutes
            { duration: "10s", target: 10 }, // scale down. Recovery stage.
            { duration: "3m", target: 10 },
            { duration: "10s", target: 0 },
          ],
          gracefulStop: "2m",
        },
      },
    };
    
    export default function () {
      let page = Math.floor(Math.random() * 400) + 1;
      const BASE_URL = `http://localhost:5000/api/products?page=${page}`
      const responses = http.batch([
        ["GET", `${BASE_URL}`, null],
        ["GET", `${BASE_URL}`, null],
        ["GET", `${BASE_URL}`, null],
        ["GET", `${BASE_URL}`, null],
      ]);
    
      check(responses[0], {
        'status is 200': (res) => res.status === 200,
      });
    }
    ```
   
<img width="946" alt="9" src="https://user-images.githubusercontent.com/97604953/232985928-500e241e-45c5-4650-9318-864b62b8a0fe.png">

<img width="1671" alt="10" src="https://user-images.githubusercontent.com/97604953/232985981-9285e31b-e58d-4f07-9f11-1b8f50867029.png">

<img width="997" alt="11" src="https://user-images.githubusercontent.com/97604953/232985972-f9ec1986-3e9f-4e9d-84b2-e09cc98c07f2.png">

