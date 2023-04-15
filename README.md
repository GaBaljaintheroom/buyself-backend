# buyself-backend

## AWS RDS 데이터 베이스 다시 생성후 연동
## rds에 원본 데이터 더미 삽입 완료
<img width="952" alt="rds더미데이터" src="https://user-images.githubusercontent.com/97604953/232224824-152837dc-8e20-4a00-9792-58328d7f8e3e.png">


## pagination이 되어있는 상품 전체 리스트를 반환하는 api 응답 시간 측정

- 총 페이지: 4, 한 페이지당 6개의 상품을 반환, 총 데이터 23개


**캐시 이용 전 응답시간 : 평균 60ms**
<img width="1145" alt="1" src="https://user-images.githubusercontent.com/97604953/232224961-4bc1d19f-db7d-459d-91e6-af2ca98375f2.png">


**레디스를 이용한 캐시 이용 후 응답시간 : 평균 29ms**

<img width="1190" alt="2" src="https://user-images.githubusercontent.com/97604953/232224991-e5e3066f-6529-4e77-92b1-2ba1b927a2b2.png">


데이터의 개수가 22개밖에 없다보니 확실히 캐시를 이용하지 않아도 응답시간이 빨라 캐시의 의미가 딱히 없다는 생각이 들었다.

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

100명의 유저가 30초동안 상품리스트 페이지를 1페이지부터 400페이지까지 랜덤으로 들어가게 하는 성능 테스트를 시도해보았다.

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
