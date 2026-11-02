.PHONY: e2e e2e-local test-scripts

e2e:
	./scripts/e2e-docker.sh

e2e-local:
	./scripts/e2e-local.sh

test-scripts:
	./scripts/setup-local-db.test.sh
