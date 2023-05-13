from elasticsearch import Elasticsearch
import json
import os


def inputData():
    es = Elasticsearch("http://elasticsearch:9200/")

    if es.indices.exists(index='dictionary'):
        return
    else:
        es.indices.create(
            index='dictionary',
            body={
                "settings": {
                    "index": {
                        "analysis": {
                            "analyzer": {
                                "nori_token": {
                                    "type": "custom",
                                    "tokenizer": "nori_tokenizer",
                                    "filter": ["my_synonyms"]
                                }
                            },
                            "filter": {
                                "my_synonyms": {
                                    "type": "synonym",
                                    "synonyms_path": "synonym.txt"
                                }
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "id": {
                            "type": "integer",
                        },
                        "class_name": {
                            "type": "text",
                            "analyzer": "nori_token"
                        },
                        "price": {
                            "type": "integer",
                        },
                        "img_url": {
                            "type": "text",
                        },
                        "analyze": {
                            "type": "keyword"
                        }
                    }
                }
            }
        )

    scriptpath = os.path.dirname(__file__)
    filename = os.path.join(scriptpath, 'productData.json')

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
