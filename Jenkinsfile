pipeline {
    agent any

    parameters {
        string(name: 'IMAGE_NAMESPACE', defaultValue: 'your-dockerhub-username', description: 'Docker Hub namespace')
        string(name: 'K8S_NAMESPACE', defaultValue: 'devnov', description: 'Kubernetes namespace')
    }

    environment {
        API_IMAGE = "docker.io/${params.IMAGE_NAMESPACE}/devnov-api:${env.BUILD_NUMBER}"
        FRONTEND_IMAGE = "docker.io/${params.IMAGE_NAMESPACE}/devnov-frontend:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build and push images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set -eu
                        printf '%s' "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USER" --password-stdin
                        docker build -t "$API_IMAGE" ./server
                        docker build -t "$FRONTEND_IMAGE" ./client
                        docker push "$API_IMAGE"
                        docker push "$FRONTEND_IMAGE"
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh '''
                        set -eu
                        kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
                        kubectl --namespace "$K8S_NAMESPACE" apply -f kubernetes/devnov.yaml
                        kubectl --namespace "$K8S_NAMESPACE" set image deployment/devnov-api devnov-api="$API_IMAGE"
                        kubectl --namespace "$K8S_NAMESPACE" set image deployment/devnov-frontend devnov-frontend="$FRONTEND_IMAGE"
                        kubectl --namespace "$K8S_NAMESPACE" rollout status deployment/devnov-api
                        kubectl --namespace "$K8S_NAMESPACE" rollout status deployment/devnov-frontend
                    '''
                }
            }
        }
    }
}
