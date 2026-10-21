---
title: "Proof of work NFTs"
date: "2023-07-25T07:19:36Z"
modified: "2023-07-25T07:19:36Z"
lang: "en"
category: "idee"
path: "/ideas/proof-of-work-nfts/"
wpId: 188
---

#### I think this idea is worth many $$$

**But I hate the whole degen side of crypto**, so I’ll never implement it. Go for it, implement it and get rich 🤣

Lets take a 32 bytes string:

```
0xFFFFFFFFFFFFFFFF000000000000000000000000000000000000000000000000
```

For each of the byte we can assign a characteristic of the NFT. Lets imagine that we are creating NFT weapons for a videogame. The first byte could represent the category of the weapon (sword, axe, bow, …), the second byte could represent an aesthetic feature of the weapon, the third the power of the sword and so on.

I’m simplyfing, in reality you should be using multiple bytes to represent one characteristic, so that the most rare values of a characteristic are values like AA-AA-AA-AA while less rare values are XX-XX-XX-AA, where XX are random values.

#### Proof of work

The users willing to mint the weapon NFT (blacksmiths) need to find the keccak256 of a specific string (such as “nftproject-salt-X”, where X is the variable) so that the resulting hash reflectes the characteristics that the user is searching for.

*If I want to have a black sword, I need to search for an hash that begins with 01 (= sword type) and then the next byte 03 (= black color), then with the next 4 bytes I can assign a feature such as XX-XX-01-01 “+4 strength” to the player.*

So I want to search for a string that when applied the keccak256 fn gives as result

```
0x01-03-F1-32-01-01-...
```

In F1-32-01-01, F1 and 32 are just random numbers, but the important part is in 01-01, it represents the “+4 strength” characteristic.

#### The race for the best keccak256

Now that we found a way to generate rarity for any NFT we can also limit the amount of NFTs with a specific value of a characteristic, or we can assign a tier for each characteristic. For example, there are maximum 10 NFTs that have 5 characteristic with the maximum tier.

#### Fine tuning

The developer can fine tune the project reducing the number of available values for each characteristic using *mod N* where N is the number of maximum value for each byte.

## If you get rich…

And you want to donate something: *0x098e22Fbfb894264c70241FDfEe6090D80b0da76*
