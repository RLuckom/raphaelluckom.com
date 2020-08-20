#!/bin/bash
hugo
aws s3 sync site/ s3://raphaelluckom.com --delete
