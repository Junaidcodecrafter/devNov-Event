pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
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
                    
                    # Point minikube to ubuntu user profile directory if needed
                    export MINIKUBE_HOME=/home/ubuntu
                    
                    # Get Minikube Docker environment parameters
                    eval $(minikube -p minikube docker-env)

                    # Build images directly into Minikube local registry
                    docker build -t devnov-api:latest ./server
                    docker build -t devnov-frontend:latest ./client
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
EOFcat << 'EOF' > ~/devNov-Event/Jenkinsfile
pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
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
                    
                    # Point minikube to ubuntu user profile directory if needed
                    export MINIKUBE_HOME=/home/ubuntu
                    
                    # Get Minikube Docker environment parameters
                    eval $(minikube -p minikube docker-env)

                    # Build images directly into Minikube local registry
                    docker build -t devnov-api:latest ./server
                    docker build -t devnov-frontend:latest ./client
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
