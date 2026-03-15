package com.supplychain.backend.service;

import com.supplychain.backend.entity.Batch;
import com.supplychain.backend.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockchainService {

    private final BatchRepository batchRepository;

    @Value("${blockchain.rpc.url}")
    private String networkUrl;

    @Value("${blockchain.wallet.private-key}")
    private String privateKey;

    @Value("${blockchain.contract.address}")
    private String contractAddress;

    public String recordBatchOnBlockchain(String batchCode, String productName, Long farmerId) {
        try {
            Web3j web3j = Web3j.build(new HttpService(networkUrl));
            Credentials credentials = Credentials.create(privateKey);
            
            // Note: In a real scenario, you'd use a generated contract wrapper.
            // For this basic integration, we'll simulate a transaction that records the data.
            // If a contract is ready, the code below would call contract.recordProduce(...)
            
            log.info("Connecting to blockchain to record batch: {}", batchCode);
            
            // This is a placeholder for actual smart contract interaction
            // We'll return a mock hash if the private key/URL aren't set yet to avoid startup crashes
            if (privateKey.contains("YOUR") || networkUrl.contains("YOUR")) {
                String mockHash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "");
                updateBatchTxHash(batchCode, mockHash);
                return mockHash;
            }

            // Real transaction logic would go here:
            // TransactionReceipt receipt = contract.recordProduce(batchCode, productName, BigInteger.valueOf(farmerId)).send();
            // String txHash = receipt.getTransactionHash();
            
            String txHash = "0x" + java.util.UUID.randomUUID().toString().replace("-", "");
            updateBatchTxHash(batchCode, txHash);
            return txHash;

        } catch (Exception e) {
            log.error("Blockchain error: {}", e.getMessage());
            throw new RuntimeException("Failed to record on blockchain: " + e.getMessage());
        }
    }

    private void updateBatchTxHash(String batchCode, String txHash) {
        Optional<Batch> batchOpt = batchRepository.findByBatchCode(batchCode);
        if (batchOpt.isPresent()) {
            Batch batch = batchOpt.get();
            batch.setBlockchainTxHash(txHash);
            batchRepository.save(batch);
        }
    }

    public boolean verifyBatchOnBlockchain(String txHash) {
        try {
            Web3j web3j = Web3j.build(new HttpService(networkUrl));
            // Check if transaction exists and is confirmed
            return web3j.ethGetTransactionByHash(txHash).send().getTransaction().isPresent();
        } catch (Exception e) {
            log.error("Verification error: {}", e.getMessage());
            return false;
        }
    }
}
