package spring.ecommerce.project.service;

import org.springframework.stereotype.Service;
import spring.ecommerce.project.dto.ProductRequest;
import spring.ecommerce.project.exception.ApiException;
import spring.ecommerce.project.model.Product;
import spring.ecommerce.project.repository.ProductRepository;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product addProduct(ProductRequest request) {
        Product product = new Product();
        mapRequest(product, request);
        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found"));
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        mapRequest(product, request);
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    private void mapRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());
        product.setImage(request.image());
    }
}

