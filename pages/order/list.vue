<template>
	<view class="content">
		<!-- 检索-->
		<div class="handle-box">
			<el-input v-model="filter.order_number" placeholder="订单号" class="handle-input lg mr5"></el-input>
		    <el-input v-model="filter.username" placeholder="用户名" class="handle-input mr5"></el-input>
			<el-input v-model="filter.addr_name" placeholder="收件人姓名" class="handle-input mr5"></el-input>
			<el-select v-model="filter.status" filterable clearable default-first-option placeholder="订单状态" class="handle-select mr5">
			    <el-option v-for="item in statusList" :key="item.status" :label="item.name" :value="item.status"></el-option>
			</el-select>
		    <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
		    <el-button icon="el-icon-refresh" @click="filter = {}">重置</el-button>
		</div>
		<!-- 列表 -->
		<el-table v-if="loaded" :data="list" height="calc(100% - 120px)" @sort-change="changeTableSort">
			<el-table-column label="购买商品">
				<template slot-scope="scope">
					<div v-if="index === 0 || scope.row.showAll" class="g-cell row" v-for="(item, index) in scope.row.products" :key="index">
						<image class="pic" :src="item.image" mode="aspectFill"></image>
						<div class="right column">
							<span class="title">{{ item.title }}</span>
							<div class="bot row">
								<span v-if="item.sku.name" class="attr">{{ item.sku.name }}</span>
								<span class="num">x {{ item.number }}</span>
							</div>
						</div>
					</div>
					<div v-if="scope.row.products.length > 1" class="more-btn center" @click="showAllProducts(scope.row)">
						<span>{{ scope.row.showAll ? '收起' : '查看更多' }}</span>
					</div>
				</template>
			</el-table-column>
			
			<el-table-column prop="order_number" label="订单号" width="210"></el-table-column>
			<el-table-column prop="user.username" label="购买用户" width="150">
				<div slot-scope="scope" class="column">
					<span>{{ scope.row.user.username }}</span>
					<span>{{ scope.row.user.nickname }}</span>
				</div>
			</el-table-column>
			<el-table-column label="实际支付金额" width="120">
				<span slot-scope="scope">{{ scope.row.price_data.pay_price | price }}</span>
			</el-table-column>
			<el-table-column label="支付状态" width="130">
				<span slot-scope="scope">{{ scope.row.pay_status === 1 ? '已支付' : '未支付' }}</span>
			</el-table-column>
			<el-table-column label="订单状态" width="130">
				<span class="status-text" :class="'status-text-' + scope.row.status" slot-scope="scope">{{ scope.row.status_text }}</span>
			</el-table-column>
			
			<el-table-column label="操作" width="130" align="center">
				<template slot-scope="scope">
					<el-button type="primary" plain icon="el-icon-document-remove" @click="showDetail(scope.row)">详情</el-button>
					<el-button type="primary" v-if="scope.row.status===1" t icon="el-icon-truck" @click="deliveryOrder(scope.row)">发货</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div v-if="loaded" class="pagination">
			<el-pagination background @current-change="pagination" layout="total,prev,pager,next,jumper" :current-page="page" :page-size="limit" :total="totalSize">
			</el-pagination>
		</div>
		
		<!-- 发货面板 -->
		<delivery-order ref="deliveryOrder" @refreshData="loadList"></delivery-order>
		<!-- 订单详情 -->
		<detail ref="detail"></detail>
	</view>
</template>

<script>
	import deliveryOrder from './components/delivery-order.vue'
	import detail from './components/detail.vue'
	export default {
		components: {
			deliveryOrder,
			detail
		},
		data() {
			return {
				filter: {},
				statusList: [
					{status: 0 , name: '待付款'},
					{status: 1 , name: '待发货'},
					{status: 2 , name: '待收货'},
					{status: 3 , name: '待评价'},
					{status: 4 , name: '已完成'},
					{status: 10 , name: '已关闭'},
					{status: 11 , name: '已取消'},
					{status: 12 , name: '申请退货'},
					{status: 14 , name: '正在退货'},
					{status: 15, name: '退货完成'}
				],
				list: [],
			}
		},
		created() {
			if(this.$route.params.status){
				this.filter.status = this.$route.params.status;
			}
			this.loadList();
		},
		methods: {
			/* 获取订单列表 */
			async loadList() {
				const {page, limit} = this;
				const sendData = {
					offset: (page-1)*limit,
					limit,
					...this.filter
				}
				const response = await this.$request('order', 'getList', sendData);
				this.list = response.data;
				this.totalSize = response.affectedDocs;
				this.loaded = true;
				console.log(response);
			},
			//搜索
			search(){
				this.page = 1;
				this.loadList()
			},
			//发货
			deliveryOrder(item){
				this.$refs.deliveryOrder.data = JSON.parse(JSON.stringify(item));
				this.$refs.deliveryOrder.formVisible = true;
			},
			//查看详情
			showDetail(item){
				this.$refs.detail.open(item);
			},
			showAllProducts(item){
				this.$set(item, 'showAll', !item.showAll);
			}
		}
	}
</script>

<style scoped lang="scss">
	/deep/ {
		.el-button--primary.is-plain{
			background: #fff;
			
			&:hover{
				color: #409EFF;
			}
		}
		.el-button+.el-button{
			margin: 6px 0 0 0;
		}
	}
	.mr5{
	    margin-right: 5px !important;
	}
	.mr20{
	    margin-right: 20px !important;
	}
	.handle-select {
	    width: 140px;
	}
	.handle-input {
	    width: 140px;
	    display: inline-block;
		
		&.lg{
			width: 170px;
		}
	}
	.status-text{
		font-size: 15px;
		color: #409EFF;
		font-weight: bold;
		
		&-0{
			color: #ff0000
		}
		&-3, &-4{
			color: #67c23a;
		}
		&-10, &-11, &-15{
			color: #999;
		}
	}
	.g-cell{
		padding: 10px 0 10px 5px;
		
		&:last-child{
			margin-bottom: 0;
		}
		.pic{
			flex-shrink: 0;
			width: 50px;
			height: 50px;
			margin-right: 10px;
		}
		.title{
			font-size: 14px;
			color: #333;
		}
		.bot{
			font-size: 12px;
			color: #999;
		}
		.attr{
			margin-right: 10px;
		}
	}
	.more-btn{
		width: 60px;
		margin-left: 1px;
		color: #409EFF;
	}
</style>
