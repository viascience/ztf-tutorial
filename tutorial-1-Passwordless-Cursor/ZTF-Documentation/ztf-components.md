[Skip to content](#via-ztf-components)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

VIA ZTF Components

Initializing search

* [Zero Trust Fabric (ZTF)](..)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")
ZTF Product Documentation

* Zero Trust Fabric (ZTF)

  Zero Trust Fabric (ZTF)
  + [Documentation Overview](..)
  + [Getting Started Tutorial](../tutorial/)
  + [VIA ZTF Overview](../via-ztf-overview/)
  + VIA ZTF Components

    [VIA ZTF Components](./)

    Table of contents
    - [Verifiable Credential](#verifiable-credential)
    - [Issuer](#issuer)
    - [Verifier](#verifier)
    - [VIA Wallet](#via-wallet)

      * [Benefits of Digital Identity in VIA Wallet](#benefits-of-digital-identity-in-via-wallet)
    - [Decentralized Identity (DID) Registry](#decentralized-identity-(did)-registry)

      * [Cryptographic Keys Stored](#cryptographic-keys-stored)
      * [Example](#example)
  + [Additional Supporting Components](../additional-components/)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + [VIA ZTF Setup and Integration](../integration/)
  + [Glossary](../glossary/)
  + [Definitions](../definitions/)

# VIA ZTF Components[¶](#via-ztf-components "Permanent link")

VIA ZTF is composed of five key components that work together to manage digital identities and secure data access: Verifiable Credential, Issuer, Verifier, VIA Wallet, and Decentralized Identity (DID) Registry. The following sections further detail the functions and interactions of each component.

## Verifiable Credential[¶](#verifiable-credential "Permanent link")

A VC is a tamper-resistant digital credential that represents claims about a subject in a cryptographically secure format. Following a W3C standard, VCs are the digital equivalent of physical certifying documents, such as a driver's license, passport, or professional certifications. VCs offer a secure and tamper-proof way to prove identity, qualifications, and permissions in a digital environment. Furthermore, they can grant access to services or systems, functioning as digital keys for various platforms.

Any party can validate that a VC was issued by a trusted authority and hasn't been altered without needing to contact the VC's issuer directly. This is done by acknowledging the issuer's public key and using it to verify the VC's digital signature. A VC also allows for selective disclosure, enabling holders to reveal only specific attributes instead of the entire credential. This makes VCs ideal for a user-centric identity system where individuals maintain sovereignty over their credentials.

Additional details about VCs can be found in the [W3C standard](https://www.w3.org/TR/vc-data-model-2.0/).

| FAQs about Verifiable Credentials (VCs) | |
| --- | --- |
| How do VCs replace the need for passwords? | Passwords are specific to each organization that authorizes access to a system. For example, your bank, your email, and your laptop each require a separate password. Credentials, on the other hand, are unique to an individual and can work across multiple organizations and systems. Take the example of a passport. The traveler is in control of their passport at all times, and showing it to any airline is sufficient to verify their identity. The same passport is used across all airlines and borders. While an airline may still store metadata about a user, the airline will not store the passport itself, which prevents identity theft. |
| What is the difference between VCs and Passkeys? | While Passkeys and VCs can both be used to authenticate users, VCs are more flexible and have a broader set of user cases. A Passkey is specific to a service and is a replacement for a password. Its sole function is to authenticate a user to a specific service. While a VC can provide authentication like a Passkey, it can also store arbitrary attributes about an entity. This enables VCs to be used for authorization (i.e., providing specific, cryptographically verifiable attributes about yourself). Additionally, a VC can work across multiple services given that it's a portable credential. |
| What happens if I lose my VC? | The VIA implementation of VCs makes it very challenging for a VC to be lost or compromised. In the rare event a VC is lost or compromised, the VC can be revoked, unlike a password. This makes the credential immediately invalid across all services. VCs are stored in the VIA Wallet. The VIA Wallet itself requires either biometric verification or a traditional password-based verification, and the VIA Wallet stores the VC in a hardware-backed secure enclave. The only way for your VC to be compromised is if a malicious actor gains unauthorized access to your mobile device and is capable of bypassing verification mechanisms for the VIA Wallet. |

## Issuer[¶](#issuer "Permanent link")

A VC Issuer is a trusted authority that creates and digitally signs VCs. The Issuer determines how to verify a subject's identity and attributes before issuing the VC.

For example, a military base acting as the VC Issuer could issue a VC to a visiting contractor after confirming their identity. The base has the flexibility to set its own verification standards. For high security, they might require multiple forms of identification, a company letter, and a background check. For a regular visitor, they might only require an existing company badge and a valid driver's license. The main point is that the issuer controls the verification process and standards.

## Verifier[¶](#verifier "Permanent link")

A Verifier is an entity that requests and validates VPs. Because VPs are signed by a VC Issuer, Verifiers can cryptographically confirm that a credential was issued by a trusted source and has not been tampered with without requiring a connection or contact with the VC Issuer directly. Based on the verified information, the Verifier can then make an access or service decision.

## VIA Wallet[¶](#via-wallet "Permanent link")

The holder of a VC needs a secure solution for storing the credential. At VIA, this is accomplished using the VIA Wallet.

VIA Wallet is a comprehensive mobile solution that enables users to maintain full ownership and control of their digital identity, private keys, and VCs. It serves as a secure, user-centric platform for managing digital identities and credentials, and offers seamless onboarding through familiar social logins like Google, Apple, and Microsoft. This ensures users can easily access the platform while maintaining sovereignty over their personal information.

### Benefits of Digital Identity in VIA Wallet[¶](#benefits-of-digital-identity-in-via-wallet "Permanent link")

* Self-Sovereign Identity
* Users have complete control over their identity information
* No central authority controls or stores the identity
* Users choose what information to share and with whom
* Privacy by Design
* Selective disclosure of information
* Cryptographic proof of claims without revealing unnecessary data
* Zero-knowledge proofs for verification when applicable
* Security and Trust
* Cryptographically secured information
* Tamper-evident credentials
* Verifiable authenticity of claims
* Protection against identity theft and fraud

## Decentralized Identity (DID) Registry[¶](#decentralized-identity-(did)-registry "Permanent link")

The DID Registry is a server that holds keys used to enable end-to-end encrypted communication among different parties, even when they are not online at the same time.

The DID Registry can have several different clients, which can be thought of as applications. For a given client, when one of its users (A) wants to send encrypted data to another user (B), the client retrieves user B's key from the DID Registry and provides it to user A. Because user B does not need to be online for this key exchange, user A can construct the encrypted data and send it to user B. User B will be able to decrypt and read the data the next time they come online.

### Cryptographic Keys Stored[¶](#cryptographic-keys-stored "Permanent link")

The keys stored in the DID Registry are ephemeral, or single-use. Their purpose is to enable the secure exchange of a longer-term symmetric key, which is then used for encryption. This process is formally known as a Key Encapsulation Mechanism (KEM), which is why the keys in the DID Registry are often referred to as KEM keys.

Each KEM key is actually two key pairs: one "classic" public/private key pair and one "post-quantum" public/private key pair. VIA's KEM process combines these key exchanges to create a hybrid KEM. This ensures our process is quantum-resistant, while also providing fallback security in case a vulnerability is discovered in the newer quantum-resistant algorithms.

The classical KEM key pair uses Elliptic Curve Diffie-Hellman (ECDH) with elliptic curve P-384. The post-quantum key pair uses Module-Lattice-based KEM (ML-KEM-1024). Both are NIST standards and follow CNSA 2.0 mandates.

### Example[¶](#example "Permanent link")

To better understand how the DID Registry works, the following diagram illustrates an example of two parties who wish to share encrypted data. This basic flow of DID Registry usage from a user's perspective.

![Login flow](../assets/did_architecture.drawio.png)

Figure 1: Flow of two users sharing encrypted data.

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
