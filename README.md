# ChatFrar - Rapport de Projet de Fin d'Études

## Présentation du Projet

ChatFrar est une application de messagerie instantanée moderne et sécurisée, conçue pour offrir une expérience de communication fluide et intuitive. Développée dans le cadre d'un projet de fin d'études s'étalant sur 9 semaines (250 heures), l'application propose des fonctionnalités avancées comme les discussions en temps réel, le chat de groupe, l'intégration de l'IA via Gemini, et des mini-jeux.

![ChatFrar Screenshot](./screenshot.png)

## Fonctionnalités principales

- 💬 **Chat en temps réel** - Communication instantanée avec vos contacts
- 🔒 **Sécurité maximale** - Protection par authentification JWT
- 🎮 **Mini-jeux intégrés** - Jeu de Tic-Tac-Toe disponible dans les conversations privées
- 🤖 **Assistant IA Gemini** - Intégration d'un assistant intelligent via la commande @gemini
- 👥 **Groupes de discussion** - Créez et gérez des conversations de groupe
- 🎨 **Interface moderne** - Design intuitif avec animations fluides
- 📱 **Responsive Design** - Interface adaptée à tous les appareils

## Stack Technologique

### Frontend
- **Framework**: React 18 avec TypeScript
- **Gestion d'état**: React Context API, useState, useReducer
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS avec composants personnalisés
- **Icons**: Lucide React pour une bibliothèque d'icônes cohérente
- **HTTP Client**: Axios pour les requêtes API
- **Bundler**: Vite pour des performances optimales

### Backend
- **Runtime**: Node.js avec Express.js
- **Base de données**: PostgreSQL hébergé sur Supabase
- **ORM**: Prisma pour la gestion et les migrations de base de données
- **WebSockets**: Socket.IO pour la communication en temps réel
- **Authentication**: JWT (JSON Web Tokens), OAuth 2.0
- **Cloud Storage**: Supabase Storage pour les fichiers et médias
- **API IA**: Integration de l'API Gemini de Google

### Déploiement & Infrastructure
- **Frontend**: Vercel
- **Backend**: Heroku
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry pour le suivi des erreurs

## Architecture de la Base de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Users    │     │   Messages  │     │    Groups   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ username    │     │ content     │     │ name        │
│ email       │     │ timestamp   │     │ created_at  │
│ password    │     │ sender_id   │─┐   │ creator_id  │─┐
│ avatar      │     │ receiver_id │─┘   │             │ │
│ created_at  │     │ group_id    │─────┘             │ │
│ updated_at  │     │ is_deleted  │                   │ │
└──────┬──────┘     │ reply_to_id │                   │ │
       │            └─────────────┘                   │ │
       │                                              │ │
       │            ┌─────────────┐     ┌─────────────┐ │
       └────────────┤GroupMembers │     │ UserStatus  │ │
                    ├─────────────┤     ├─────────────┤ │
                    │ group_id    │─────┤ user_id     │◄┘
                    │ user_id     │◄────┤ status      │
                    │ is_admin    │     │ last_seen   │
                    │ joined_at   │     └─────────────┘
                    └─────────────┘
```

## Journal de Développement

### Semaine 1: Planification et Configuration (30h)

**Tâches réalisées :**
- Définition du cahier des charges et des spécifications techniques
- Mise en place de l'architecture React/TypeScript du projet
- Configuration de l'environnement de développement (Vite, ESLint, Prettier)
- Création des premiers mockups UI/UX avec Figma

**Difficultés rencontrées :**
- Difficulté à définir un périmètre réaliste pour le projet compte tenu du temps imparti
- Choix entre différentes solutions de base de données (MongoDB vs PostgreSQL)

**Solutions apportées :**
- Priorisation des fonctionnalités selon la méthode MoSCoW (Must, Should, Could, Won't)
- Choix de PostgreSQL via Supabase pour bénéficier des fonctionnalités temps réel et de l'écosystème

### Semaine 2: Interface Utilisateur de Base (35h)

**Tâches réalisées :**
- Développement des composants UI fondamentaux (Chat, Login, Navbar)
- Implémentation du système de routing avec React Router
- Configuration du système d'authentification basique
- Mise en place de la structure de gestion d'état

**Difficultés rencontrées :**
- Problèmes de performance avec les animations complexes sur la page d'accueil
- Gestion cohérente du responsive design

**Solutions apportées :**
- Optimisation des animations avec Framer Motion en utilisant des techniques de lazy loading
- Implémentation d'une approche mobile-first avec des breakpoints Tailwind personnalisés

### Semaine 3: Backend et Base de Données (30h)

**Tâches réalisées :**
- Configuration de l'API Express et des routes principales
- Mise en place de la base de données PostgreSQL avec Supabase
- Création du schéma de données avec Prisma
- Développement des endpoints CRUD pour les utilisateurs et messages

**Difficultés rencontrées :**
- Complexité de la relation many-to-many pour les groupes et utilisateurs
- Performance des requêtes pour récupérer l'historique des messages

**Solutions apportées :**
- Implémentation d'une table intermédiaire GroupMembers avec des champs additionnels
- Mise en place d'indexes PostgreSQL et pagination pour optimiser les requêtes de messages

### Semaine 4: Communication en Temps Réel (25h)

**Tâches réalisées :**
- Implémentation de Socket.IO pour la communication en temps réel
- Développement des fonctionnalités de messagerie instantanée
- Création des indicateurs de présence et de frappe
- Tests de charge pour évaluer la scalabilité

**Difficultés rencontrées :**
- Synchronisation des états entre plusieurs clients et gestion des conflits
- Problèmes de déconnexion lors de la mise en veille des appareils mobiles

**Solutions apportées :**
- Mise en place d'un système de versioning des messages
- Implémentation d'un mécanisme de reconnexion automatique avec reprise d'état

### Semaine 5: Authentification et Sécurité (25h)

**Tâches réalisées :**
- Implémentation de l'authentification JWT complète
- Mise en place du système de refresh token
- Cryptage des données sensibles
- Protection des routes et middlewares de sécurité

**Difficultés rencontrées :**
- Gestion sécurisée des tokens côté client
- Problèmes de CORS avec les WebSockets
- Vulnérabilités potentielles aux attaques XSS

**Solutions apportées :**
- Stockage des tokens dans httpOnly cookies
- Configuration d'une politique CORS stricte avec liste blanche de domaines
- Implémentation de Content Security Policy (CSP) et sanitization des inputs

### Semaine 6: Fonctionnalités Avancées (30h)

**Tâches réalisées :**
- Développement du système de groupes et de leurs permissions
- Implémentation des fonctionnalités de recherche avancée
- Création du système de mentions et notifications
- Intégration initiale de l'API Gemini

**Difficultés rencontrées :**
- Gestion complexe des permissions dans les groupes
- Optimisation des recherches full-text dans PostgreSQL
- Quotas et limites de l'API Gemini

**Solutions apportées :**
- Système de rôles basé sur des bitmasks pour une gestion flexible des permissions
- Mise en place d'indexes GIN pour les recherches textuelles
- Implémentation d'un système de cache et de limitation de requêtes pour Gemini

### Semaine 7: Mini-jeux et Intégrations (25h)

**Tâches réalisées :**
- Développement du mini-jeu Tic-Tac-Toe
- Intégration des aperçus de liens
- Prise en charge du partage de médias (images, audio)
- Fonctionnalités d'édition et de suppression de messages

**Difficultés rencontrées :**
- Synchronisation de l'état du jeu entre plusieurs clients
- Problèmes de performance avec le rendu des aperçus de liens
- Gestion du stockage et des formats de médias

**Solutions apportées :**
- Architecture state machine pour le jeu avec validation côté serveur
- Mise en cache des métadonnées d'aperçu et lazy loading
- Implémentation d'un service de compression et transformation d'images

### Semaine 8: Test, Performance et Optimisation (25h)

**Tâches réalisées :**
- Écriture des tests unitaires et d'intégration
- Optimisation des performances frontend (mémo, virtualisation)
- Amélioration du temps de chargement initial
- Mise en place de l'analyse de bundle et optimisations

**Difficultés rencontrées :**
- Complexité du testing des composants avec animations
- Performance des listes de messages pour les conversations longues
- Taille excessive du bundle JS initial

**Solutions apportées :**
- Utilisation de @testing-library/react avec des mocks pour Framer Motion
- Implémentation de react-window pour le rendu virtualisé des messages
- Code-splitting, lazy loading et optimisation des dépendances

### Semaine 9: Déploiement et Finalisation (25h)

**Tâches réalisées :**
- Configuration du déploiement CI/CD
- Mise en production sur Vercel (frontend) et Heroku (backend)
- Documentation technique complète
- Tests utilisateurs finaux et corrections de bugs

**Difficultés rencontrées :**
- Différences de comportement entre environnements de développement et production
- Problèmes de performance en production avec charges réelles
- Gestion des variables d'environnement entre différentes plateformes

**Solutions apportées :**
- Mise en place d'environnements de staging identiques à la production
- Implémentation de monitoring avec Sentry pour identifier et corriger les problèmes
- Utilisation d'un système centralisé de gestion des secrets (GitHub Secrets)

## Fonctionnalités Détaillées

### Module de Chat
- Messagerie en temps réel avec indicateurs de frappe et de statut
- Prise en charge des médias (images, audio, vidéo)
- Fonctionnalités d'édition, suppression et réponses aux messages
- Recherche de messages avec filtres avancés

### Système de Groupes
- Création et gestion de groupes avec rôles personnalisables
- Invitation par lien ou par nom d'utilisateur
- Système de modération avec bannissement temporaire
- Historique d'activité et statistiques

### Intégration IA
- Assistant Gemini accessible via commande @gemini
- Suggestions de réponses intelligentes
- Traduction automatique des messages
- Résumé de conversations longues

### Mini-jeux
- Tic-Tac-Toe multijoueur en temps réel
- Système d'invitation et de matchmaking
- Classement et statistiques de jeu
- Extensible pour d'autres mini-jeux

## Perspectives d'Évolution

- **Optimisation des performances** pour les conversations longues
- **Système de notifications push** via Service Workers
- **Mode sombre/clair** et thèmes personnalisables
- **Intégration d'autres APIs d'IA** en complément de Gemini
- **Amélioration des mini-jeux** avec plus d'options et de variantes

## Conclusion

Ce projet de fin d'études a permis de mettre en œuvre un large éventail de technologies modernes du développement web, en relevant les défis techniques liés aux applications temps réel et aux interfaces utilisateur interactives. ChatFrar représente non seulement une application fonctionnelle de messagerie instantanée, mais aussi une démonstration des bonnes pratiques en matière de développement logiciel, de sécurité, et d'expérience utilisateur.

## Contact

Pour toute question ou suggestion concernant ce projet de fin d'études, n'hésitez pas à me contacter :

Email: contact@chatfrar.com
# chat
