from dotenv import load_dotenv
import os

# .env 파일에서 환경 변수 로드
load_dotenv()

ACCESS_KEY_ID = os.getenv('ACCESS_KEY_ID')
SECRET_ACCESS_KEY = os.getenv('SECRET_ACCESS_KEY')
S3_BUCKET_REGION = os.getenv('S3_BUCKET_REGION')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
