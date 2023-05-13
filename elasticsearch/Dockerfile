ARG ELASTIC_VERSION

# https://www.docker.elastic.co/
FROM docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION}

# Add your elasticsearch plugins setup here
# Example: RUN elasticsearch-plugin install analysis-icu
RUN bin/elasticsearch-plugin install analysis-nori
RUN cd /usr/share/elasticsearch/config
RUN mkdir userdict_ko.txt

COPY synonym.txt /usr/share/elasticsearch/config/
RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/config/synonym.txt

RUN mkdir /usr/share/elasticsearch/config/userdict
RUN chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/config/userdict