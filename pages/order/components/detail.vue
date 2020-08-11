<template>
	<el-dialog class="dialog" :close-on-click-modal="false" :visible.sync="formVisible">
		<div v-if="formVisible" class="wrap">
			<div class="s-header">
				<span>订单信息</span>
			</div>
			<div class="cell">
				<span class="tit">订单编号</span>
				<span>{{ data.order_number }}</span>
			</div>
			<div v-if="data.pay_type" class="cell">
				<span class="tit">付款方式</span>
				<span>{{ data.pay_type==='wxpay'?'微信支付':data.pay_type==='alipay'?'支付宝支付':'余额支付' }}</span>
			</div>
			<div class="cell">
				<span class="tit">订单备注</span>
				<span>{{ data.remarks }}</span>
			</div>
			<div class="log-list">
				<div class="cell" v-for="(item, index) in data.timeline" :key="index">
					<span class="tit">{{ item.type }}</span>
					<span>{{ item.time | date('Y-m-d H:i:s') }}</span>
				</div>
			</div>
			<div class="s-header">
				<span>商品信息</span>
			</div>
			<div class="p-list">
				<div class="p-item row" v-for="(item, index) in data.products" :key="index">
					<image class="pic" :src="item.image" mode="aspectFill"></image>
					<div class="right column">
						<span class="title">{{ item.title }}</span>
						<span class="attr">{{ item.sku.name }}</span>
						<div class="bot">
							<span class="price">￥{{ item.price | price }}</span>
							<span class="num">x{{ item.number }}</span>
						</div>
					</div>
				</div>
				
				<div class="cell">
					<span class="tit">商品总价</span>
					<span>￥{{ data.price_data.goods_price }}</span>
				</div>
				<div class="cell">
					<span class="tit">优惠券</span>
					<span>-￥0</span>
				</div>
				<div class="cell">
					<span class="tit">订单满减</span>
					<span>-￥0</span>
				</div>
				<div class="cell">
					<span class="tit">积分抵扣</span>
					<span>-￥0</span>
				</div>
				<div class="cell">
					<span class="tit">实付款</span>
					<span style="font-weight:700;font-size: 16px;color:#ff4400">￥{{ data.price_data.pay_price | price }}</span>
				</div>
			</div>
			<div class="s-header">
				<span>收货信息</span>
			</div>
			<div class="cell">
				<span class="tit">收货人</span>
				<span>{{ data.address.name }}</span>
			</div>
			<div class="cell">
				<span class="tit">联系方式</span>
				<span>{{ data.address.mobile }}</span>
			</div>
			<div class="cell">
				<span class="tit">收货地址</span>
				<span>{{ data.address.address.address }}{{ data.address.room }}</span>
			</div>
			<template v-if="expressInfo.name">
				<div class="cell">
					<span class="tit">快递公司</span>
					<span>{{ expressInfo.name }}</span>
				</div>
				<div class="cell">
					<span class="tit">物流单号</span>
					<span>{{ data.logistic_code }}</span>
				</div>
			</template>
			
			<div v-if="expressInfo.name && expressInfo.data.length > 0" class="s-header">
				<span>物流信息</span>
			</div>
			<div v-if="expressInfo.name && expressInfo.data.length > 0" class="exp-list">
				<div class="item" v-for="(item, index) in expressInfo.data" :key="index">
					<span class="time">{{ item.time }}</span>
					<span class="val">{{ item.context }}</span>
				</div>
			</div>
			<div slot="footer" class="dialog-footer center">
				<el-button size="medium" class="confirm-btn" type="primary" @click="formVisible = false">确定</el-button>
			</div>
		</div>
	</el-dialog>
</template>

<script>
	export default {
		data() {
			return {
				data: {},
				expressInfo: [],
				formVisible: false, //表单显示状态
			}
		},
		methods: {
			open(data){
				data = JSON.parse(JSON.stringify(data))
				data.timeline.reverse()
				this.data = data;
				this.formVisible = true;
				
				if(data.express_info){
					console.log(1);
					this.expressInfo = data.express_info;
				}else if (data.shipper_code && data.logistic_code && !data.express_info) {
					console.log(2);
					this.loadExpressInfo();
				}else{
					console.log(3);
					this.expressInfo = {}
				}
			},
			async loadExpressInfo(){
				/* const res = await this.$request('order', 'getExpressInfo', {
					order_id: this.data._id,
					shipper_code: this.data.shipper_code,
					logistic_code: this.data.logistic_code,
					phone: this.data.address.mobile
				});
				this.expressInfo = res.data; */
			}
			
		}
	}
</script>

<style scoped lang="scss">
	/deep/{
		.el-dialog__body{
			padding-top: 0px;
		}
		.el-dialog__headerbtn .el-dialog__close{
			font-size: 24px;
		}
	}
	.s-header{
		padding-bottom: 16px;
		margin-top: 20px;
		
		&:first-child{
			margin: 0;
		}
		span{
			font-size: 15px;
			color: #333;
			font-weight: bold;
		}
	}
	.cell{
		display: flex;
		padding: 7px 0;
		min-height: 36px;
		padding-left: 20px;
		
		span{
			font-size: 14px;
			color: #333;
		}
		.tit{
			width: 80px;
			color: #999;
		}
	}
	.p-item{
		padding: 10px 20px;
		padding-left: 20px;
		
		.pic{
			flex-shrink: 0;
			width: 70px;
			height: 70px;
			margin-right: 12px;
			border-radius: 4px;
		}
		.title{
			margin-bottom: 6px;
			font-size: 14px;
			color: #333;
		}
		.attr, .num{
			font-size: 13px;
			color: #999;
		}
		.bot{
			padding-top: 8px;
		}
		.price{
			margin-right: 10px;
			font-size: 14px;
		}
	}
	.exp-list{
		padding-left: 20px;
		
		.item{
			display: flex;
			margin-top: 10px;
			
			&:first-child{
				margin-top: 0;
				
				.time, .val{
					color: #409EFF;
				}
			}
		}
		.time{
			flex-shrink: 0;
			width: 150px;
			font-size: 14px;
			color: #999;
			line-height: 1.5;
		}
		.val{
			font-size: 14px;
			color: #999;
			line-height: 1.5;
		}
	}
	.dialog-footer{
		margin-top: 20px;
	}
</style>
