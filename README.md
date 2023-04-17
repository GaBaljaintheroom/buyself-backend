# buyself-backend

## AWS RDS 데이터 베이스 다시 생성후 연동
## rds에 원본 데이터 더미 삽입 완료
<img width="952" alt="rds더미데이터" src="https://user-images.githubusercontent.com/97604953/232224824-152837dc-8e20-4a00-9792-58328d7f8e3e.png">


## pagination이 되어있는 상품 전체 리스트를 반환하는 api 응답 시간 측정

- 총 페이지: 4, 한 페이지당 6개의 상품을 반환, 총 데이터 23개, pagination을 이용해 자동 인덱스 생성


**캐시 이용 전 응답시간 : 평균 60ms**
<img width="1145" alt="1" src="https://user-images.githubusercontent.com/97604953/232224961-4bc1d19f-db7d-459d-91e6-af2ca98375f2.png">


**레디스를 이용한 캐시 이용 후 응답시간 : 평균 29ms**

<img width="1190" alt="2" src="https://user-images.githubusercontent.com/97604953/232224991-e5e3066f-6529-4e77-92b1-2ba1b927a2b2.png">


데이터의 개수가 22개밖에 없다보니 확실히 캐시를 이용하지 않아도 응답시간이 빨라 캐시의 의미가 딱히 없다는 생각이 들었다.

## 그런데 나는 대체 왜 전체 상품 리스트를 반환하는 Controller에 pagination과 cache를 적용할려 했을까?

### !!!여기서 잠깐!!!

**pagination을 이용한 인덱스를 생성하면 뭐가 좋은가?**

페이지 번호와 함께 인덱스를 사용하면, SQL 쿼리에서 LIMIT 및 OFFSET을 사용하여 현재 페이지에 표시되는 상품 데이터를 추출할 수 있습니다. 이를 통해 전체 상품 데이터를 모두 추출하지 않고도 현재 페이지의 상품 데이터만 추출할 수 있으므로, 데이터베이스의 부하를 줄이고 응답 시간을 단축할 수 있습니다.

또한, 페이지 번호와 함께 인덱스를 사용하면, 페이지네이션 UI에서 사용자가 현재 어떤 페이지를 보고 있는지를 파악하기 쉬워집니다. 사용자가 명확하게 현재 페이지를 알면, 다음 페이지나 이전 페이지로 이동하기가 더 쉬워져서 사용자 경험을 개선할 수 있습니다.

따라서, 인덱스를 사용하여 상품 데이터의 범위를 결정하면, 페이지네이션의 성능과 사용자 경험을 개선할 수 있습니다.


<details>
<summary>그렇다면 엄청난 양의 데이터에 pagination과 cache가 없다면 어떻게 될까?</summary>
<div markdown="1">       

# 50만 더미데이터 삽입 후 캐시 및 인덱스 적용

<img width="1076" alt="1" src="https://user-images.githubusercontent.com/97604953/232518747-272ba2ec-f69e-482e-8c90-b25a37570b85.png">


## 실험 1

pagination으로 인한 자동 인덱스 사용 없이 50만데이터를 전부를 한번에 반환해보도록 해보았다.

**데이터: 50만, 캐시 적용 여부: X, 인덱스 적용 X**

- 무려 **29.43**s가 걸렸다. 너무 오래 걸려 애초에 반환이 안되는 줄 알았다.
- pagination을 꼭 쓰는것이 좋겠다.

<img width="1127" alt="2" src="https://user-images.githubusercontent.com/97604953/232518800-1165be01-0680-401c-a3c9-335371fd4f5d.png">


## 실험 2

**데이터: 50만, 캐시 적용 여부: O 인덱스 적용 X**

- **응답시간 : 19.97s**
    
<img width="1180" alt="3" src="https://user-images.githubusercontent.com/97604953/232518864-c31223e5-1015-4213-8d8c-2c8da62edf40.png">
캐시를 적용하여도 반환해줘야 하는 데이터가 너무 많으니 캐시를 적용한 의미가 없다는 생각이 들었다.
    
결론은 무조건 **pagination**을 써서 반환하는 데이터의 개수를 줄여 데이터베이스의 부하를 줄이고 응답 시간을 단축하고, 페이지네이션 UI에서 사용자가 현재 어떤 페이지를 보고 있는지를 파악하기 쉽게 하도록 하는게 좋다.

## 실험 3

**데이터: 50만, 캐시 적용 여부: X, Pagination(인덱스)적용 여부: O**

- 응답 시간 : **193ms(보통 백 후반 ~ 2백 초반) 최대 : 500대 ms**도 나옴

<img width="1102" alt="4" src="https://user-images.githubusercontent.com/97604953/232518907-22a5bc4a-2b6f-4ff4-89f9-59ef752621a5.png">



pagination을 통해 반환하는 데이터의 개수를 줄여 cache를 적용하지 않아도 확실히 조회 속도가 빨라졌다.

### !!!여기서 잠깐!!!

**우리는 어떤 데이터를 캐싱해야할까?** 

- 업데이트가 자주 발생하지 않는 데이터
- 잦은 업데이트가 발생하는 데이터를 캐싱한다면 업데이트가 발생할 때마다 DB의 데이터와 캐시 데이터의 정합성을 맞추는 작업을 실시해야 하기 때문에 오히려 성능에 악영향을 줄 수 있다.
- 자주 조회되는 데이터를 사용한다.
- 조회 요청이 거의 없는 데이터를 캐싱한다면 그저 메모리만 낭비하는 데이터가 될 수 있으며, 조회시에도 본 스토리지에 요청을 보내기 전 캐시에 데이터가 존재하는지 확인해야하는 작업을 거치기 때문에 오히려 조회 속도가 더 느려질 수 있다.

*전체 상품 데이터를 반환하는 리스트는 사용자에게 자주 조회되는 데이터이고 업데이트가 상대적으로 자주 발생하지 않다고 판단되어 cache를 적용하는 것이 좋다고 생각되었다.*

## 실험 4

**데이터: 50만, 캐시 적용 여부: O, Pagination(인덱스)적용 여부: O**

- 응답 시간 : **평균 31ms**
<img width="1244" alt="5" src="https://user-images.githubusercontent.com/97604953/232519001-1bc81e84-d9cb-4e22-9328-56d488a16f85.png">



|  | 데이터 수 | 캐시 적용 여부  | 인덱스 적용 여부 | 응답 시간 |
| --- | --- | --- | --- | --- |
| 실험1 | 50만 | X | X | 29.43S |
| 실험2 | 50만 | O | X | 19.97s |
| 실험3 | 50만 | X | O | 193ms |
| 실험4 | 50만 | O | O | 31ms |

pagination을 적용해도 데이터의 개수(50만)가 많다 보니 cache를 적용하지 않았을 때와 했을 때의 차이는 꽤 났다. (193ms → 31ms) 193ms가 적지 않은 시간이라고 생각할 수 있지만 193ms의 시간이 다른 데이터를 응답 받기 위한 이전의 응답시간이라면 사용자의 서비스 이용 시간에 대한 만족도는 그리 높지 않을 것이라고 생각했다. 현재 서비스의 데이터는 23개뿐이라 pagination과 cache를 이용한 응답속도의 감소는 체감이 덜하다고 느꼈지만 50만 데이터같은 대용량을 넣어보고 cache와 pagination을 적용 전/후로 응답속도를 확인해보니 확실히 필요성을 느낄 수 있었다.
    

</div>
</details>
    


***실제 대형마트의 상품 리스트는 어떨까? 국내 대형마트의 과자/시리얼 카테고리를 중점으로 찾아보았다.***

## 국내 대형마트 과자/시리얼 카테고리 전체 상품 리스트 조사

#### 홈플러스 

카테고리별로 상품리스트가 나뉘어 있음

과자/시리얼 → 과자/쿠키/파이 카테고리: 총 4,120개의 상품, 총 103페이지, 한 페이지당 40개의 상품이 있다.

따른 카테고리 역시 한 페이지당 40개의 상품이 있음

#### 이마트 

카테고리별로 상품리스트가 나뉘어 있음

과자/시리얼 → 과자/쿠키/파이 카테고리: 총 31,157개의 상품, 총 390페이지, 한 페이지당 80개의 상품이 있다.

따른 카테고리 역시 한 페이지당 80개의 상품이 있음

#### 롯데마트

카테고리별로 상품리스트가 나뉘어 있음

과자/시리얼 카테고리: 총 2,100개의 상품, 총 35페이지, 한 페이지당 60개의 상품이 있다.

따른 카테고리 역시 한 페이지당 60개의 상품이 있음

## AWS RDS - Mysql에 더미 데이터 삽입

```python
create
    definer = junsu1222@`%` procedure insertLoop()
BEGIN
    DECLARE i INT DEFAULT 24;
    WHILE i <= 32000 DO
        INSERT INTO products(id, class_name, price, img_url, created_at, updated_at)
				VALUES (i, concat('product_name',i), 10000+i, concat('product_path',i), STR_TO_DATE('2023-04-14 15:55:38', '%Y-%m-%d %H:%i:%s'), STR_TO_DATE('2023-04-14 15:55:38', '%Y-%m-%d %H:%i:%s'));
        SET i = i + 1;
    END WHILE;
END;
```

프로시저를 이용한 더미데이터를 삽입하였다. 국내 대형마트의 과자 시리얼 품목중 전체 상품 리스트를 확인하여 가장 상품과 페이지수가 많은 이마트를 참고하여 32000개의 데이터를 삽입하였다.
<img width="1006" alt="3" src="https://user-images.githubusercontent.com/97604953/232225041-7b19b17d-6171-476c-9824-d3261409dfd3.png">



## 더미 데이터 삽입후 상품 리스트 페이지 응답시간 확인

- 총 페이지: 400, 한 페이지당 80개의 상품을 반환, 총 데이터 32000개

**캐시 이용 전 평균 응답시간 : 82ms**

생각보다 많은 시간이 늘어나진 않았다. 60ms → 82ms

<img width="1218" alt="4" src="https://user-images.githubusercontent.com/97604953/232225047-20aafa0b-2af6-453a-a761-6767b473c4a3.png">


**캐시 이용 후 평균 응답시간: 26ms**

<img width="1203" alt="5" src="https://user-images.githubusercontent.com/97604953/232225053-17b01e20-f6d0-4bfa-96e3-0d6d4b7e79a7.png">


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
## 실험 1

100명의 유저가 30초동안 상품리스트 페이지를 1페이지부터 400페이지까지 랜덤으로 들어가게 하는  성능 테스트를 시도해보았다.(*총 페이지: 400, 한 페이지당 80개의 상품을 반환, 총 데이터 32,000개, pagination 적용*)

**캐시 적용 전** 

<img width="1012" alt="6" src="https://user-images.githubusercontent.com/97604953/232225068-a66dc6c8-52f9-40e2-9a14-be4056339612.png">


http_req_duration을 확인해보니 요청의 총 평균 시간이 769.76ms가 나왔다.

**캐시 적용 후**

<img width="994" alt="7" src="https://user-images.githubusercontent.com/97604953/232225073-50328667-b932-4d19-8d58-69addf08de33.png">


http_req_duration을 확인해보니 요청의 총 평균 시간이 47.24ms가 나왔다.

# Grafana를 이용한 시각화

Grafana를 이용해 시각화 할려면 influxdb와 grafana가 docker-compose로 올려야한다.

```jsx
services:
  influxdb:
    image: bitnami/influxdb:1.8.5
    container_name: influxdb
    ports:
      - "8086:8086"
      - "8085:8088"
    environment:
      - INFLUXDB_ADMIN_USER_PASSWORD=bitnami123
      - INFLUXDB_ADMIN_USER_TOKEN=admintoken123
      - INFLUXDB_HTTP_AUTH_ENABLED=false
      - INFLUXDB_DB=myk6db
  granafa:
    image: bitnami/grafana:latest
    ports:
      - "3000:3000"
```

```bash
k6 run \
  --out influxdb=http://localhost:8086/junsuk6db \
  script.js
```
<img width="957" alt="8" src="https://user-images.githubusercontent.com/97604953/232225081-060a2757-bc01-4efe-9a9f-9c9b6a7c1c8c.png">

<img width="1664" alt="9" src="https://user-images.githubusercontent.com/97604953/232225084-3e3d60bc-fde5-4f0e-8a26-2ab4fe309513.png">

22.46ms까지 나오기도 한다.

## 실험 2

100명의 유저가 30초동안 상품리스트 페이지를 1페이지부터 5000페이지까지 랜덤으로 들어가게 하는  성능 테스트를 시도해보았다.(*총 페이지: 5,000, 한 페이지당 100개의 상품을 반환, 총 데이터 500,000개*)

**캐시 적용 전, 적용후 모두 Request Failed가 떴다. http_req_failed가 100%다.** 

상품 전체 조회리스트를 반환하는 페이지에 캐시와 페이징 기능을 적용하고 인덱스를 생성하였다 하더라도 데이터의 양이 많을 경우 k6 성능 테스트를 진행할 때 `http_req_failed`가 100%로 나타날 수 있다는 것을 깨달았다.

이는 데이터 조회에 필요한 작업이 많아져서 서버 응답 시간이 길어지고, k6가 설정된 시간 내에 모든 요청을 보내기 어려워서 생길 수 있는 문제이다. 이러한 경우에는 성능 테스트 설정을 조정하거나, 더 많은 리소스를 할당하여 성능을 개선할 수 있다. 

아무레도 flask는 작은 규모의 애플리케이션에서 사용되므로 50만의 대용량을 성능테스트하기에는 어려워 보인다.
<img width="1379" alt="ㅂㅈ" src="https://user-images.githubusercontent.com/97604953/232520639-4de97135-5130-402b-9b63-74df5e13fbe4.png">


