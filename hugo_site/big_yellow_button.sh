#!/bin/bash
hugo --config ./test_config.toml
aws s3 sync site/ s3://test.raphaelluckom.com --delete
