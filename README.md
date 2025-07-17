# Website-Assets


<!--
This template is meant for a monorepo approach where all the work
for a client is stored here, even if it has multiple components
or multiple projects.
Document all the technical details relevant to this client within
the repo itself.
-->

## 👥 Contributing
- [How to contribute to the codebase](./CONTRIBUTING.md#-how-can-i-contribute-to-the-code-base)
- [How to make a release](./CONTRIBUTING.md#-how-do-i-prepare-a-release)

## :telescope: Overview
<!-- Give an overview of the client's main goal
the repo itself. --!>

<!-- If the repo has more than a theme, provide a context diagram:
![Context diagram](./docs/diagrams/context.png)
-->

This repository is a monorepo that will contain all the code base for
the client.

## 🗂️ Repository Structure

This repository is organized as a monorepo, containing multiple components and utilities for the project. Below is an overview of the main directories:

- **storefront/**
  - Contains the main storefront codebase, likely for a web or e-commerce frontend.
  - Subfolders:
    - `templates/`, `snippets/`, `sections/`, `locales/`, `layout/`, `config/`, `assets/`: Standard structure for a modern web storefront (e.g., Shopify theme or similar).
  - Key files: `package.json`, `config.yml.example`, `.gitignore`, `.prettierignore`.

- **pdf-generation/**
  - Node.js service for generating PDFs.
  - Contains:
    - `assets/`: Assets used for PDF generation.
    - `index.js`, `helpers.js`: Main logic and utilities.
    - `package.json`, `package-lock.json`, `Procfile`, `.gitignore`, `README.md`.

- **fedex-integration/**
  - Python service for integrating with FedEx APIs and related data processing.
  - Subfolders:
    - `shopify/`, `fedex_resource/`, `data_models/`: Code and models for integration and data handling.
  - Key files: `main.py`, `misc.py`, `requirements.txt`, `pyproject.toml`, `poetry.lock`, `Procfile`, `response_sample.json`, `field_values.md`, `.gitignore`, `__init__.py`.

- **docs/**
  - Documentation, diagrams, and other project-related docs.

- **Top-level files**
  - `README.md`: This file.
  - `CONTRIBUTING.md`: Contribution guidelines.
  - `.gitignore`: Git ignore rules.
  - `set_version.sh`: Shell script for version management.

<!-- If the repo has more than a theme, provide a container diagram:
## :house: Architecture

![Container diagram](./docs/diagrams/container.png)
-->

## :jigsaw: Components

<!--
A component can be a theme, a react app, a python app, etc ...
Link to the README.md files in each component's folder.
Example:

### Backend apps

* [Thingy Integration app](thingy-integration-app/README.md)
-->

## :magic_wand: Processes

<!--
Sequence diagrams are stored in /docs/diagrams and rendered
in this section
-->
