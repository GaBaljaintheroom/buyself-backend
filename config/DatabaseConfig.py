from dotenv import load_dotenv
import os

# .env 파일에서 환경 변수 로드
load_dotenv()

DB_USERNAME = os.getenv('DB_USERNAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_SCHEMA = os.getenv('DB_SCHEMA')
DB_PORT = os.getenv('DB_PORT')

def getURI():
    return 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8'.format(DB_USERNAME, DB_PASSWORD,
                                                                DB_HOST, DB_PORT, DB_SCHEMA)
SQLALCHEMY_DATABASE_URI = getURI()
SQLALCHEMY_TRACK_MODIFICATIONS = False