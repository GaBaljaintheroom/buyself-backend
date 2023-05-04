from flask import jsonify, Response, request
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Resource, Namespace
from elasticsearch import Elasticsearch

from controller.elasticSearch import inputData

es = Elasticsearch("http://elasticsearch:9200/")

db = SQLAlchemy()

Products = Namespace(
    name="Products",
    description="Prodeucts 데이터를 조회하기 위해 사용되는 API.",
)

parser = Products.parser()
parser.add_argument('kw', type=str, required=False, help='검색어 입력')

# GET /api/search?kw={kw}
@Products.route('api/search')
@Products.expect(parser)
@Products.doc(responses={200: 'Success'})
@Products.doc(responses={500: 'We Can''t find data'})
class ProductsClass(Resource):
    def get(self):
        """키워드 검색을 통해 상품 정보를 가져옵니다. """
        args = parser.parse_args()
        kw = args['kw']
        if not kw:
            return Response(status=404)

        # 페이지 번호를 가져옵니다. 기본값은 1입니다.
        page = int(request.args.get('page', '1'))

        # 결과 수를 지정합니다. 기본값은 80입니다.
        size = 80

        # 검색 쿼리를 생성합니다.
        search_body = {
            "query": {
                "match": {
                    "class_name": str(kw)
                }
            },
            "from": (page - 1) * size,
            "size": size
        }

        # Elasticsearch에서 결과를 검색합니다.
        product_results = es.search(index='dictionary', body=search_body)

        # 결과를 처리합니다.
        data_list = []
        for product_result in product_results['hits']['hits']:
            data_list.append(product_result['_source'])

        # 결과를 반환합니다.
        result = jsonify({
            'success': True,
            'data': data_list,
            'page': str(page)
        })

        return result
