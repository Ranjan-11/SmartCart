import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { CategoryResponse, ProductResponse } from '../models/product.models';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch paginated products with query parameters', () => {
    const mockPage: PageResponse<ProductResponse> = {
      content: [
        {
          id: 1,
          sku: 'SKU-001',
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard',
          price: 99.99,
          stockQuantity: 15,
          categoryId: 1,
          categoryName: 'Electronics',
          categorySlug: 'electronics',
          active: true,
          createdAt: new Date().toISOString()
        }
      ],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      isFirst: true,
      isLast: true
    };

    const mockResponse: ApiResponse<PageResponse<ProductResponse>> = {
      success: true,
      data: mockPage,
      timestamp: new Date().toISOString()
    };

    service.getAllProducts({ keyword: 'keyboard', page: 0, size: 10 }).subscribe((data) => {
      expect(data.content.length).toBe(1);
      expect(data.content[0].name).toBe('Mechanical Keyboard');
    });

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/products` && r.params.get('keyword') === 'keyboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch product details by ID', () => {
    const mockProduct: ProductResponse = {
      id: 10,
      sku: 'SKU-PHONE',
      name: 'SmartPhone Pro',
      description: 'Flagship phone',
      price: 899.99,
      stockQuantity: 8,
      categoryId: 1,
      categoryName: 'Electronics',
      categorySlug: 'electronics',
      active: true,
      createdAt: new Date().toISOString()
    };

    service.getProductById(10).subscribe((prod) => {
      expect(prod.id).toBe(10);
      expect(prod.sku).toBe('SKU-PHONE');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/products/10`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockProduct, timestamp: '' });
  });

  it('should fetch all categories', () => {
    const mockCategories: CategoryResponse[] = [
      { id: 1, name: 'Electronics', slug: 'electronics', createdAt: '' }
    ];

    service.getAllCategories().subscribe((cats) => {
      expect(cats.length).toBe(1);
      expect(cats[0].name).toBe('Electronics');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/categories`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockCategories, timestamp: '' });
  });
});
