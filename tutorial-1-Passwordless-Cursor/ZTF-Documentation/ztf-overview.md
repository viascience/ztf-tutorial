[Skip to content](#via-ztf-overview)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

VIA ZTF Overview

Initializing search

* [Zero Trust Fabric (ZTF)](..)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")
ZTF Product Documentation

* Zero Trust Fabric (ZTF)

  Zero Trust Fabric (ZTF)
  + [Documentation Overview](..)
  + [Getting Started Tutorial](../tutorial/)
  + VIA ZTF Overview

    [VIA ZTF Overview](./)

    Table of contents
    - [Core Components and Their Functions](#core-components-and-their-functions)
    - [Key Benefits](#key-benefits)
    - [Additional Supporting Components](#additional-supporting-components)
  + [VIA ZTF Components](../via-ztf-components/)
  + [Additional Supporting Components](../additional-components/)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + [VIA ZTF Setup and Integration](../integration/)
  + [Glossary](../glossary/)
  + [Definitions](../definitions/)

# VIA ZTF Overview[¶](#via-ztf-overview "Permanent link")

The zero trust security model operates on the principle of "never trust, always verify." It assumes that no user or device, whether inside or outside the network, should be trusted by default. This approach treats every access request as a potential threat, requiring strict verification before granting access to sensitive information. By continuously verifying every request, organizations can securely share data and prevent risks associated with compromised credentials or data breaches.

VIA Zero Trust Fabric (ZTF) is a software security solution designed to provide secure access to networks and applications for enterprise customers. It enables passwordless authentication, allowing users to store their digital identity with full ownership and control. This enables users to use their digital identities across various services, which can then request to view a subset of the stored information and cryptographically verify its authenticity.

## Core Components and Their Functions[¶](#core-components-and-their-functions "Permanent link")

VIA ZTF is comprised of five key components that work together to manage digital identities and secure data access:

* **Verifiable Credential (VC)**: This is a cryptographically secure, tamper-evident digital identity file that is machine-verifiable. The credential is never stored centrally; instead, each user holds it in their VIA Wallet. The digital signatures on the credentials are a hybrid of classical CNSA 1.0 and NIST post-quantum compliant signatures, making them future-proof against quantum computing threats.
* **Issuer**: This component securely generates VCs. It is a website that can be hosted on a local, on-premise, or cloud server. Users verify their identity through an existing enterprise single sign-on (SSO) system.
* **Verifier**: The verifier is a website that authenticates a user's credentials without retaining any sensitive data. It confirms the data within a credential, the hybrid digital signature of the issuer, and checks the public key in the DIR to ensure the credential has not been revoked. After verification, the verifier deletes the credential and issues a temporary security token to the user for network access.
* **VIA Wallet**: This is a mobile application for iOS and Android devices. It stores a user's credentials and private keys within the smartphone's secure hardware enclave. The wallet uses the phone's camera to scan QR codes to send and receive information, enabling a passwordless login process that is three times faster and more reliable than traditional passwords.
* **Decentralized Identity Registry (DID Registry)**: This is a registry and admin console used in VIA's ZTF solution. It stores the public keys of all registered users. Administrators can use it to flag a user's public key as inactive, thereby revoking their credentials.

## Key Benefits[¶](#key-benefits "Permanent link")

* **Enhanced Security**: VIA ZTF provides a zero trust architecture that enhances protection against breaches by using decentralized, revocable credentials. Its passwordless design eliminates common attack vectors like phishing and stolen credentials. The system also features quantum-resistant, end-to-end encryption to protect data against future threats from quantum computers.
* **Enterprise Adaptability**: The system is designed for seamless integration into complex enterprise environments. It connects with existing infrastructure such as RBAC, ABAC, SSO, and IAM solutions. VIA ZTF also operates effectively in various environments, including cloud (e.g., AWS, Azure), on-premise, and even air-gapped networks.
* **Operational Simplicity**: The platform is built to reduce operational burdens and save time. The passwordless login is significantly faster than traditional password and multi-factor authentication (MFA) methods. Onboarding is automated by linking credential issuance to existing systems, which reduces the time and resources needed for IT administration.

## Additional Supporting Components[¶](#additional-supporting-components "Permanent link")

In addition to the core components listed above, ZTF also requires the following supporting components:

* **Authentication Server**: An authentication server, working in conjunction with the Verifer, acts as the primary system for verifying a user's identity before granting them access to an application.
* **Keycloak Plugin**: ZTF uses a custom Keycloak plugin that operates within the authentication server to redirect requests to a decentralized verification system.

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
