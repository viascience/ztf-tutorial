[Skip to content](#definitions-and-examples)

[![logo](../assets/logo_white.png)](.. "ZTF Product Documentation")

ZTF Product Documentation

Definitions

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
  + [Additional Supporting Components](../additional-components/)
  + [VIA ZTF Example Flow](../ztf-flow/)
  + [VIA ZTF Setup and Integration](../integration/)
  + [Glossary](../glossary/)
  + [Definitions](./)

# Definitions and Examples[¶](#definitions-and-examples "Permanent link")

The following are definitions of key terms that will be used throughout this report to explain the ZTF system. Examples are included where applicable. All terms are industry standard unless otherwise noted.

| Term | Definition |
| --- | --- |
| Blockchain | A blockchain is software that is distributed across multiple physical computers that records transactions in a way that makes the records permanent (immutable) and resists unauthorized changes or tampering. |
| dApp (decentralized application) | A dApp (decentralized application) is a software application where user credentials (e.g., login and password information) are held by each user and never stored centrally by the dApp creator / owner. |
| Digital Signature | A digital signature is a mathematical technique used to validate the authenticity and integrity of digital data such as documents, emails, or software. It is unique to each signer and ensures the data has not been tampered with after signing. |
| JSON | JavaScript Object Notation (JSON) is an industry-standard data interchange format. |
| JWT Security Token | A JSON Web Token (JWT) is an industry-standard type of security token that is used to securely transmit information between parties as a JSON object. It is a self-contained way to transfer data while ensuring its integrity and authenticity. |
| Key Identifiers | A key identifier is information that clearly reveals the identity of a customer (e.g., customer name). |
| Public and Private Key Pairs | A public key and a private key are a pair of mathematically linked cryptographic keys used in asymmetric cryptographic systems. The public key is distributed and used to encrypt data, or verify digital signatures. It does not need to be kept secret. The private key is kept secret by its owner and used to decrypt data that was encrypted with the linked public key or to create digital signatures. It must remain confidential to maintain security. |
| Quantum Resistance | Quantum resistance refers to the development of cryptographic algorithms that can withstand the decryption capabilities of quantum computers. This is important because quantum computers are expected to break current encryption methods. Implementing quantum-resistant cryptography now ensures that sensitive information remains secure even as quantum computing technology advances. The NSA has made it mandatory for all U.S. Government national security systems to become quantum secure. We expect this mandate to extend to major U.S. companies soon as well. |
| Smartphone Secure Enclave | A secure enclave is a highly protected hardware-based component embedded in all modern iPhone and Android smartphones (e.g., from iPhone 5s onwards) that provides an isolated and trusted environment for processing sensitive data and cryptographic operations. This includes: Hardware Isolation: The secure enclave is physically separated from the main processor, providing an extra layer of security. Encrypted Memory: It uses encrypted memory to protect data in use. Limited Access: The enclave is inaccessible to the main operating system and other software, reducing the attack surface |
| Verifiable Credentials (VC) | A verifiable credential (VC) is a digital credential that is cryptographically secure, tamper-evident, and machine-verifiable. It is commonly used as a digital representation of physical credentials like passports, driver's licenses, and academic degrees, with added security and privacy features enabled by cryptography. |
| Abridged Verifiable Credential Example: ![](../assets/credentials.png) *Figure 1: Abridged Verifiable Credential Example* Full example can be found in the associated file named *"example-verifiable-credential-v0.1.json"* | |
| Verifiable Presentation (VP) | A verifiable presentation (VP) is a subset of a verifiable credential, or an aggregate of parts of multiple verifiable credentials. Each VP is digitally signed by the holder to prevent tampering. The holder can selectively disclose only the attributes from their credentials in the presentation specific to each use case, instead of sharing the entire credential data. Verifiable presentations support zero-knowledge proofs, enabling the holder to prove their attributes (e.g., authorization to access an application) without revealing data (e.g., user name, entity, etc.). |
| Abridged Verifiable Presentation Example:  ![](../assets/presentation.png)  *Figure 2: Abridged Verifiable Presentation Example*  Full example can be found in the associated file named *"example-verifiable-presentation-v0.1.json"* | |
| Wallet | A wallet (also called a self-custody or non-custodial wallet) is a software application that stores the cryptographic secrets needed to access and manage a user's blockchain-based digital assets. Wallets enable users to connect directly to blockchain networks and decentralized applications (dApps) without relying on third-party intermediaries or centralized authorization. |

Made with
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
