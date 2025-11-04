[Skip to content](#additional-supporting-components-1)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

Additional Supporting Components

Initializing search

* [Zero Trust Fabric (ZTF)](..)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")
ZTF Product Documentation

* Zero Trust Fabric (ZTF)

  Zero Trust Fabric (ZTF)
  + [Documentation Overview](..)
  + [Getting Started Tutorial](../tutorial/)
  + [VIA ZTF Overview](../via-ztf-overview/)
  + [VIA ZTF Components](../via-ztf-components/)
  + Additional Supporting Components

    [Additional Supporting Components](./)

    Table of contents
    - [Authentication Server](#authentication-server)
    - [ZTF Keycloak Plugin](#ztf-keycloak-plugin)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + [VIA ZTF Setup and Integration](../integration/)
  + [Glossary](../glossary/)
  + [Definitions](../definitions/)

# Additional Supporting Components[¶](#additional-supporting-components-1 "Permanent link")

In addition to the ZTF Core Components, a ZTF deployment requires two additional components: an authentication server and a plugin for Keycloak (a popular open-source Identity and Access Management software).

## Authentication Server[¶](#authentication-server "Permanent link")

An Authentication Server (AS) is a system that verifies a user's identity before granting them access to a resource. Its main job is to confirm a user is who they claim to be. It manages the user's session to provide seamless access after the initial login.

In ZTF, the AS, represented by Keycloak with the custom ZTF Plugin, acts as the primary system for verifying a user's identity before granting them access to an application. When a user tries to log in, the application redirects the request to Keycloak. The custom ZTF Plugin within Keycloak intercepts the request and forwards it to the Forward Authentication Service (FAS), which orchestrates a separate, decentralized verification process using the user's Verifiable Credentials. Once the FAS successfully validates the user's credentials, it notifies Keycloak to grant access.

## ZTF Keycloak Plugin[¶](#ztf-keycloak-plugin "Permanent link")

VIA ZTF Keycloak plugin is a custom module that extends Keycloak's standard authentication features to integrate with the ZTF system.

Its primary function is to intercept a user's login request, which would normally be handled directly by Keycloak, and forward it to the Forward Authentication Service (FAS). This plugin acts as a bridge, allowing the authentication flow to be handled by the decentralized, VC-based verification system without requiring the core application to be rewritten. After the FAS successfully verifies the user's Verifiable Presentation (VP), it notifies the plugin, which then instructs Keycloak to grant the user access to the application. This makes the plugin a crucial component for enabling a passwordless, verifiable credential-based login within a traditional identity and access management (IAM) framework.

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
