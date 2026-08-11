import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

const CLIENT_ID_HEADER = 'x-client-id';

@Public()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private clientId(@Headers(CLIENT_ID_HEADER) clientId?: string): string {
    // The header is attacker-controlled — cap its length so it can never
    // bloat the database, and never store an empty value.
    const id = (clientId ?? '').trim().slice(0, 64);
    return id || 'anonymous';
  }

  @Get()
  getCart(@Headers(CLIENT_ID_HEADER) clientId?: string) {
    return this.cartService.getCart(this.clientId(clientId));
  }

  @Post('items')
  addItem(
    @Headers(CLIENT_ID_HEADER) clientId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(this.clientId(clientId), dto);
  }

  @Patch('items/:productId/:size')
  updateQuantity(
    @Headers(CLIENT_ID_HEADER) clientId: string | undefined,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('size') size: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.cartService.updateQuantity(
      this.clientId(clientId),
      productId,
      size,
      quantity,
    );
  }

  @Delete('items/:productId/:size')
  removeItem(
    @Headers(CLIENT_ID_HEADER) clientId: string | undefined,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('size') size: string,
  ) {
    return this.cartService.removeItem(this.clientId(clientId), productId, size);
  }

  @Delete()
  clearCart(@Headers(CLIENT_ID_HEADER) clientId?: string) {
    return this.cartService.clearCart(this.clientId(clientId));
  }
}
