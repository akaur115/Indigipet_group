# IndigiPet

## Project Overview

IndigiPet is an Android mobile application designed to make Ojibwe (Anishinaabemowin) language 
learning interactive and enjoyable.
The application combines language-learning games with a virtual pet named Esiban, a raccoon 
that users can care for while learning the language.
Users will complete lessons, earn experience points (XP) and in-game currency, and use their 
rewards to take care of Esiban.
The goal of IndigiPet is to encourage users to practice Ojibwe regularly while building a 
connection with their virtual pet.

## Project Team

| Name | Role |
|------|------|
| Tylor Young | Project Manager |
| Arshpreet Kaur | Developer |
| Jaspreet Kaur | Developer |
| Arshpreet Kaur | Developer |

## Project Objectives

The main objectives of IndigiPet are:

- Create an engaging Ojibwe language-learning experience.
- Encourage regular learning through a virtual pet system.
- Allow users to create accounts and save their progress.
- Develop interactive lessons and language-learning games.
- Introduce vocabulary through text, images, and audio.
- Allow users to earn XP and in-game currency.
- Encourage users to care for Esiban through learning activities.

## Project Scope

### In Scope

The following features are included in the current project scope:

- Android mobile application
- User registration and login
- Firebase cloud integration
- Two language-learning lessons/games
- Esiban's hunger and friendship system
- XP progression and level unlocking
- Dashboard and vocabulary page
- In-game currency
- Voice-over functionality

### Out of Scope

The following features are not included in the current
project scope:

- Web application
- Shop
- Paid premium features
- Pet customization
- Offline mode
- Pet animations
- Apple/iOS application

## Technology Stack

The project will use:

- React Native
- Expo
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Git and GitHub
- PostHog
- Sentry.io

## Authentication Requirements

Users must create an account to access IndigiPet.

The registration process will require:

- Name
- Username
- Email
- Password

Users will be able to log in using their registered
email address and password.

Each email address will be associated with one account.

Guest access will not be available.

The application is also intended to support one active
device per account. This requirement will be implemented
and tested as part of the authentication functionality.

## Planned Application Features

### Home Page

The home page will display Esiban, the user's virtual pet.

Users will be able to view Esiban's current hunger and
friendship levels.

Esiban will display different expressions and dialogue
depending on his current needs.

### Language Learning

Users will learn Ojibwe through interactive lessons
and games.

The initial vocabulary categories will include Numbers
and Food.

Vocabulary entries will include English and Ojibwe words,
along with audio pronunciation and supporting images.

### Pet Care

Esiban's hunger and friendship levels will decrease
over time.

Users will complete learning activities to earn rewards
and maintain their friendship with Esiban.

Users will be able to spend in-game currency on food
to restore Esiban's hunger.

### User Progress

The application will track user XP, level, earned currency,
unlocked categories, and learning progress.

User progress will be stored using Firebase cloud services.

## Current Development

### First Development Stage

Target client meeting: October 5, 2026

The team's current focus is developing the authentication
interface and connecting it to Firebase.

The first development stage includes:

- Welcome screen
- Account registration screen
- Login screen
- Firebase Authentication integration
- Basic account information storage
- Input validation and error handling
- Testing the registration and login process

The remaining application features will be developed
during later stages.

## Future Development

After the authentication functionality has been completed,
the team plans to begin developing the main home page.

This will include Esiban's appearance, hunger and friendship
levels, contextual dialogue, and the main application layout.

The team will then continue implementing the vocabulary,
language-learning, and pet-care features.

## Project Status
IndigiPet is currently in development.