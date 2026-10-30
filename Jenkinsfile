pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
        MINIKUBE_HOME = "/home/ubuntu"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Images in Minikube') {
            steps {
                sh '''
                    set -eu
                    minikube image build -t devnov-api:latest ./server
                    minikube image build -t devnov-frontend:latest ./client
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    set -eu
                    export KUBECONFIG=/var/lib/jenkins/.kube/config

                    kubectl apply -f kubernetes/devnov.yaml
                    kubectl rollout restart deployment/devnov-api
                    kubectl rollout restart deployment/devnov-frontend
                    kubectl rollout status deployment/devnov-api
                    kubectl rollout status deployment/devnov-frontend
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
