from flask import jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_restx import Resource, Namespace
from flask_caching import Cache

from app import app
from controller.listController import cache
from models.products import Products as ProductsModel

db = SQLAlchemy()


Products = Namespace(
    name="Products",
    description="Products 데이터를 조회하기 위해 사용하는 API.",
)


# GET /api/products/noindex
@Products.route('api/products/noindex')
@Products.doc(responses={200: 'Success'})
@Products.doc(responses={404: 'We Can''t find Page'})
class ProductsClass(Resource):
    @cache.cached(timeout=86400)
    def get(self):
        """전체 상품 리스트를 페이지 별로 가져옵니다. """
        try:
            products = ProductsModel.query.all()
            result = [{'id': product.id,
                       'class_name': product.class_name,
                       'price': product.price,
                       'img_url': product.img_url} for product in products]
            return jsonify(result)
        except TypeError:
            abort(404, "We Can't find Page")
