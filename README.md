# DevNov — 3-tier event platform
- Presentation tier: `client/` (React + Vite + Framer Motion)
- Application tier: `server/` (Node + Express, JWT auth, REST API)
- Data tier: SQLite file `server/devnov.db` (auto-created and seeded)

## Run
```
npm run install:all
npm run server     # terminal 1 -> http://localhost:4000
npm run client     # terminal 2 -> http://localhost:5173
```
Set `JWT_SECRET` env var for production. To move to Postgres/MySQL, only `server/index.js` queries change.

## Docker and Kubernetes

The client image serves the Vite build with Nginx and proxies `/api` requests to
the in-cluster API service. The API uses a persistent volume for its SQLite
database. This SQLite setup is intended for a single API replica.

Create the JWT signing secret in the Kubernetes namespace before deploying:

```
kubectl create namespace devnov --dry-run=client -o yaml | kubectl apply -f -
kubectl -n devnov create secret generic devnov-jwt-secret --from-literal=JWT_SECRET="$(openssl rand -base64 32)"
```

For a manual deployment, build and push both images, replacing the namespace
with your Docker Hub username:

```
docker build -t docker.io/YOUR_DOCKERHUB_USER/devnov-api:latest ./server
docker build -t docker.io/YOUR_DOCKERHUB_USER/devnov-frontend:latest ./client
docker push docker.io/YOUR_DOCKERHUB_USER/devnov-api:latest
docker push docker.io/YOUR_DOCKERHUB_USER/devnov-frontend:latest
```

Update the two example image names in `kubernetes/devnov.yaml` to match, then
apply the resources:

```
kubectl -n devnov apply -f kubernetes/devnov.yaml
```

The frontend Service is `LoadBalancer`. Run
`kubectl -n devnov get svc devnov-frontend` to find its external address. A
cluster with no load-balancer integration can expose it using an Ingress or
NodePort instead.

## Jenkins pipeline

Run Jenkins on a Linux agent with Docker and `kubectl` installed. Add these
Jenkins credentials:

- `dockerhub-creds`: Docker Hub username and access token (username/password).
- `kubeconfig`: kubeconfig file authorized to deploy to the target cluster.

Set the `IMAGE_NAMESPACE` and `K8S_NAMESPACE` build parameters. Create the
`devnov-jwt-secret` Kubernetes secret in that namespace before the first
pipeline run. The pipeline builds and pushes both images, applies
`kubernetes/devnov.yaml`, and waits for both rollouts.

## Push to GitHub

GitHub rejected the original unpushed commit because it uses a private email.
Find your GitHub noreply address under **Settings → Emails**, then run from the
repository root. These commands update the local, unpushed commit's author and
include the new deployment files:

```
git config user.name "Junaid"
git config user.email "YOUR_ID+Junaidcodecrafter@users.noreply.github.com"
git add -A
git commit --amend --reset-author -m "Add DevNov app and deployment pipeline" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push -u origin main
```
