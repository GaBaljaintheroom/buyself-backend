- 다음은 전체 상품 조회를 cache를 통해 성능 개선한 기록입니다. 
- 데이터베이스에는 50만 데이터가 있습니다.
# 성능테스트를 하기 위해 K6를 적용한 이유

1. 부하테스트 : k6은 애플리케이션에 대한 부하를 시뮬레이션하고 이를 통해 애플리케이션의 성능과 안정성을 평가할 수 있습니다.
2. 확장성: k6은 클라우드 기반으로 구축되어 있으므로, 사용자 수가 증가함에 따라 애플리케이션의 성능을 테스트하는 데 적합합니다. (Vus 설정가능)
3. 실시간 모니터링: k6은 실시간으로 애플리케이션의 성능을 모니터링하고 결과를 시각화하여 분석할 수 있습니다. (Influxdb 와 Gragfana로 시각화)
4. 쉬운 사용: k6은 간단하고 직관적인 명령어를 제공하여 사용자가 쉽게 성능 테스트를 수행할 수 있습니다. ( Javascprit언어로 script파일 작성 )


# pagination을 왜 이용해야 하는 이유

- 페이지 번호와 함께 인덱스를 사용하면, SQL 쿼리에서 LIMIT 및 OFFSET을 사용하여 현재 페이지에 표시되는 상품 데이터를 추출할 수 있습니다. 이를 통해 전체 상품 데이터를 모두 추출하지 않고도 현재 페이지의 상품 데이터만 추출할 수 있으므로, 데이터베이스의 부하를 줄이고 Latency을 단축할 수 있습니다.
- 여기서 인덱스는 id에 primarykey가 적용되어 자동으로 인덱스가 생성이 됩니다.
- 페이지네이션 UI에서 사용자가 현재 어떤 페이지를 보고 있는지를 파악하기 쉬워집니다. 사용자가 명확하게 현재 페이지를 알면, 다음 페이지나 이전 페이지로 이동하기가 더 쉬워져서 사용자 경험을 개선할 수 있습니다.

**결론**

- 따라서, 전체 상품 데이터 리스트에 pagination을 이용하면, **데이터베이스의 부하를 줄이고 응답 시간을 단축 할 수 있으며, 사용자의 UX가 향상됩니다.**
- pagination을 적용한 후 한 페이지당 80개의 데이터를 반환하도록 했습니다.

# Cache가 필요한 이유

**어떤 데이터를 캐싱해야할까?** 

- **업데이트가 자주 발생하지 않는 데이터**
    - 잦은 업데이트가 발생하는 데이터를 캐싱한다면 업데이트가 발생할 때마다 DB의 데이터와 캐시 데이터의 정합성을 맞추는 작업을 실시해야 하기 때문에 오히려 성능에 악영향을 줄 수 있습니다.
- **자주 조회되는 데이터를 사용한다.**
    - 조회 요청이 거의 없는 데이터를 캐싱한다면 그저 메모리만 낭비하는 데이터가 될 수 있으며, 조회시에도 본 스토리지에 요청을 보내기 전 캐시에 데이터가 존재하는지 확인해야하는 작업을 거치기 때문에 오히려 조회 속도가 더 느려질 수 있습니다.

***전체 상품 데이터를 반환하는 리스트는 사용자에게 자주 조회되는 데이터이고 업데이트가 상대적으로 자주 발생하지 않다고 판단되어 cache를 적용하는 것이 좋다고 생각되었습니다.***

따라서 Latency가 0.5s 이하, 0.8s 이하 비율을 더 높이고자 각 Page번호를 cache key로 적용시켰습니다.

## Smoke Testing

스크립트를 실행하여 스크립트가 제대로 작동하는지, 시스템이 최소한의 로드에서 작동하는지 확인하고 기본 성능 값을 수집합니다.

다음 목표를 가지고 스모크 테스트를 실행하였습니다.

- 테스트 스크립트에 오류가 없는지 확인
- 최소한의 로드에서 시스템이 오류(성능 또는 시스템 관련)를 발생시키지 않는지 확인
- 최소 부하에서 시스템 응답의 기본 성능 메트릭을 수집
<img width="988" alt="a1" src="https://user-images.githubusercontent.com/97604953/236676727-f1c6b660-877e-4f0a-9263-e5cf6d27ed38.png">


## Load Testing

Load Test는 시스템이 일반적인 날(일반적인 부하)에 성능 목표를 충족하는지 이해하는 데 도움이 됩니다. *여기서 일반적인 날은 평균적인 수의 사용자가 동시에 애플리케이션에 액세스하여 정상적이고 평균적인 작업을 수행하는 시간을 의미합니다.*

다음 목표를 가지고 로드 테스트를 실행하였습니다.

- 일반적인 부하에서 시스템 성능을 평가
- 램프 업 또는 완전 부하 기간 동안 초기 성능 저하 징후를 식별
<img width="1719" alt="a2" src="https://user-images.githubusercontent.com/97604953/236676737-e8c870e1-4c0a-4819-8303-f416385faa5b.png">


## Stress Testing

로드가 평소보다 무거울 때 시스템이 어떻게 작동하는지 평가합니다.

스트레스 테스트는 사용량이 많은 조건에서 시스템의 안정성과 신뢰성을 확인합니다. 시스템은 처리 기한, 월급날, 출퇴근 시간, 근무 종료 및 고부하 이벤트를 생성하기 위해 결합될 수 있는 기타 많은 격리된 동작과 같은 비정상적인 순간에 평소보다 높은 작업 부하를 받을 수 있습니다.
<img width="1685" alt="a3" src="https://user-images.githubusercontent.com/97604953/236676740-7b8838ee-bc52-46b8-b604-a7795408308a.png">


## Spike Testing

시스템이 갑작스럽고 대량의 사용 급증에서 살아남고 성능을 발휘하는지 확인합니다. 이러한 이벤트의 예로는 티켓 판매(ComicCon, Taylor Swift), 제품 출시(PS5, 패션 의류), 판매 발표(슈퍼볼 광고), 처리 기한(세금 신고) 및 계절별 판매(블랙 프라이데이, 크리스마스, 세인트 발렌타인)가 있습니다.

다음 목표를 가지고 스파이크 테스트를 실행하였습니다.

- 갑작스러운 트래픽 급증 시 시스템이 어떻게 작동하는지 확인
- 갑작스러운 부하 급증에서 살아남을지 여부를 확인
- 트래픽이 감소한 후 시스템이 복구되는지 여부를 판단
<img width="1715" alt="a4" src="https://user-images.githubusercontent.com/97604953/236676744-0daddb5f-d223-456d-b97e-b171cc32f8a4.png">


## 정리

- 데이터베이스에 50만 데이터를 넣고 상품 조회 API를 테스트 해보니 pagination은 필수임을 몸소 느낄 수 있었습니다.
- Cache를 사용하기 전에는 응답 Latency가 0.5s 이하 비율은 2%, 0.8s 이하 비율은 3%, 1.2s 이상의 비율은 95%였지만 Cache를 사용하여 데이터베이스의 부하를 줄이고 응답 Latency가 0.5s 이하의 비율이 100%인 상태로 200명의 유저를 유지 할 수 있었습니다.
- Stress Testing으로 응답 Latency가 http_req_failed 없이 0.5s 이하가 96%, 0.5s 초과 0.8s 이하가 2%, 1.2s 이상이 1%로 400명의 유저를 유지 할 수 있었습니다.
- flask 프레임워크를 사용해 서버 구축 후 전체 상품 조회 API에 Spike Testing 수행하면 http_req_failed 0%가 나오면서 최대 수용할 수 있는 Vus는 750임을 확인 할 수 있었습니다.

<hr>

# 다음은 상품 검색 성능 테스트 기록입니다.

## ilike연산자

상품 데이터를 검색하기 위한 검색 API를 구현하기 위해 다음과 같이 ilike연산으로 조회를 하도록 했습니다.

ilike 연산자는 like연산자와 달리 대소문자를 구분하지 않고 문자열을 비교하는 연산자입니다.

```python
search = '%%{}%%'.format(kw)
pagination = Products.query.filter(Products.class_name.ilike(search))
															.paginate(page=page, per_page=80, error_out=False)
```

## ilike연산자 + index

검색의 조회 속도를 높이기 위해 상품명 컬럼에 index를 생성해 보았습니다. 

상품명 컬럼은 insert / update / delete 가 상대적으로 자주 발생하지 않는 컬럼임으로 데이터베이스가 페이지 분할과 사용안함 표시로 인덱스의 조각화가 심해져 성능이 저하되는 일(데이터베이스 성능 이슈)이 잘 없다고 생각했습니다. 50만 데이터가 들어있는 규모가 작지 않은 테이블이라 인덱스의 성능을 볼 수 있을 것이라고 생각했습니다. 그러나 인덱스의 효과는 미미했습니다. 대부분 latency가 800ms로 측정되었습니다.

## ilike연산자 + index + cache

```python
cache.get(str((kw, page)))
```

다음과 같이 검색어와 page 번호를 cache의 키 값으로 설정하여 latency를 줄이고자 했습니다. (이때 page의 default값은 1입니다.)
캐시에 데이터가 없을 때(첫 요청)는 latency가 800ms가 나왔지만 캐시 메모리에 저장되니 응답 latency의 속도는 18ms로 굉장히 빨랐습니다.

**문제 발견**

- 랜덤 숫자를 검색어와 페이지에 둘다 적용하니 캐시의 적중률 너무 낮아 캐시의 이용률이 너무 적어 응답시간이 너무 느렸고 오류가 발생하기도 했습니다.
- 캐시의 hit가 너무 낮으면 캐시를 제대로 사용하지 못하며, 캐시 메모리에 있지 않는 데이터는 응답 latency가 너무 늦다는 단점이 있었습니다. ilike 연산자에 인덱스를 적용시켜도 성능개선은 미미하여 근본적인 데이터베이스의 조회 속도는 그리 좋다고 할 수 없었습니다.

# elasticsearch 검색엔진을 사용하게된 이유

- 관계형 데이터베이스는 단순 텍스트매칭에 대한 검색만을 제공합니다.
- 상품검색시 MySQL에 LIKE ‘%단어%’ 검색시 완벽한 전문 검색(Full Text Search)은 지원하지 않습니다
    - 하지만 엘라스틱서치는 분석기를 통한 역인덱싱 으로 이것을 완벽하게 지원합니다. 물론 요즘 MySQL 최신 버전에서 n-gram 기반의 Full-text 검색을 지원하지만, 한글 검색의 경우에 아직 많이 빈약한 감이 있습니다.
- 텍스트를 여러 단어로 변형하거나 텍스트의 특징을 이용한 동의어나 유의어를 활용한 검색이 가능합니다.
- 엘라스틱서치에서는 형태소 분석을 통한 자연어 처리가 가능합니다.
    - 엘라스틱서치는 다양한 형태소 분석 플러그인을 제공합니다.
- 엘라스틱서치에서는 관계형 데이터베이스에서 불가능한 비정형 데이터의 색인과 검색이 가능합니다.
    - 이러한 특성은 빅데이터 처리에서 매우 중요하게 생각되는 부분입니다.
- 역색인 지원으로 매우 빠른 검색이 가능합니다.
    - 검색 조건으로 Cache Key를 등록하는데 검색조건이 다양하여 Cache 성능이 떨어집니다.

```python
scriptpath = os.path.dirname(__file__)
filename = os.path.join(scriptpath, 'products.json')

with open(filename, 'r', encoding='utf-8') as file:
        datas = json.load(file)
        chunk_size = 1000  # chunk 크기 설정
        chunks = [datas['products'][i:i+chunk_size] for i in range(0, len(datas['products']), chunk_size)]
        for chunk in chunks:
            body = ""
            for i in chunk:
                body = body + json.dumps({"index": {"_index": "dictionary"}}) + '\n'
                body = body + json.dumps(i, ensure_ascii=False) + '\n'
            es.bulk(body)
```

products.json에 50만 데이터를 elasticsearch에 한번에 bulk연산하는 것은 굉장한 시간이 걸렸습니다. 따라서 1000개씩 데이터를 나누어서 색인 작업을 하니 50초 이내에 더미 데이터를 삽입할 수 있었습니다. elasticsearch로 검색엔진을 바꾸고 load Test와 Stress Test를 진행할 때 Vus를 100명씩 증가하여 안정성을 확보하고 싶었습니다.

## Smoke Testing
<img width="953" alt="b1" src="https://user-images.githubusercontent.com/97604953/236677352-31a8ae21-3248-4bd7-9615-5d60ed7cf03d.png">

## Load Testing
<img width="1709" alt="b2" src="https://user-images.githubusercontent.com/97604953/236677358-90fb58de-778f-4b69-a65f-e6f66eed3c44.png">

## Stress Testing
<img width="1716" alt="b3" src="https://user-images.githubusercontent.com/97604953/236677372-96097438-75ef-43d5-b38f-a0842d8657a1.png">

## Spike Testing
<img width="1713" alt="b4" src="https://user-images.githubusercontent.com/97604953/236677388-a0e45572-6cce-4b51-a315-417fae84debf.png">


**정리**

- Elasticsearch로 검색엔진을 구축을 하면 cache의 적중률에 따라 천차만별인 응답속도와 달리 역색인 지원으로 항상 빠른 응답을 지원했습니다.
    - **Load Testing** (ilike + index + cache 적용시) 200Vus, latency 1.2s 이상 rate : 89%, http_req_failed :  51.76% → (elasticsearch적용시) 300 Vus,  latency 1.2s 이상 rate : 0%, http_req_failed : 0%, 0.5s이하 rate : 97%, 0.8s 이하 rate : 99%로 성능 개선
    - **Stress Testing** (ilike + index + cache 적용시) 400Vus, max http_req_duration : 7.32s,  latency 0.5s 이하 rate : 97% → (elasticsarch 적용시) 500Vus, max http_req_duration : 1.57s, latency 0.5s 이하 rate : 99%로 성능 개선
- Elasticsearch는 형태소 분석을 통한 자연어 처리가 가능하고 동의어나 유의어를 활용한 검색이 가능하므로 사용자의 검색 응답 질을 높일 수 있습니다.
