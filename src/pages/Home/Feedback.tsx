import React from 'react';
import { View, StyleSheet, ViewStyle, Text, ActivityIndicator, Button, FlatList } from 'react-native';
import { observer, inject } from 'mobx-react/native';
import { Store } from '@/store';
import { req } from '@/store/web';
import { observable, runInAction, action } from 'mobx';
import { Item, takeItems, takeItems2 } from './kit';
import { retryDo } from '@/kit';
import { BACK_WHITE, LOADING_BLUE } from '@/themes/color';
import _RefreshListView, { RefreshStateType } from '@/components/RefreshListView';
import { RefreshState } from '@/components/RefreshListView';
import { SCREEN_WIDTH } from '@/components/kit';
import ItemComp from './ItemComp';
import PageSelect from './PageSelect';
import { ActionButton } from 'react-native-material-ui';
import Router from '@/router';

const RefreshListView = observer(_RefreshListView);

interface Props {
	store?: Store;
}

@inject('store')
@observer
export default class Feedback extends React.Component<Props> {
	@observable currPage: number = 1;
	@observable pageRange: [number, number] = [ 1, 1 ];
	@observable totalPageCount: number = 1;
	@observable feedbackItems: Item[] = [];
	@observable loading: boolean = false;
	@observable refreshState: RefreshStateType = RefreshState.Idle;
	pageToItems: Map<number, Item[]> = new Map();
	list: FlatList<Item> | null = null;

	render() {
		return (
			<View style={styles.container}>
				<RefreshListView
					data={this.feedbackItems.slice()}
					renderItem={({ item }) => {
						return (
							<ItemComp
								item={item}
								onPress={(item) => {
									Router.feedbackPage(item.id);
								}}
							/>
						);
					}}
					listRef={(r) => (this.list = r)}
					refreshState={this.refreshState}
					onHeaderRefresh={this.topRefresh}
					onFooterRefresh={this.bottomRefresh}
					keyExtractor={(item) => item.id.toString()}
					style={{ flex: 1 }}
					ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
					
				/>
				<ActivityIndicator size="small" color={LOADING_BLUE} style={styles.loading} animating={this.loading} />
				<PageSelect
					currPage={this.currPage}
					totalPage={this.totalPageCount}
					onCurrPageSelect={this.onCurrPageSelect}
				/>
				<ActionButton
					onPress={this.add}
					style={{ container: { backgroundColor: '#2196f3bf', width: 45, height: 45 } }}
				/>
			</View>
		);
	}

	add = () => {
		if (!this.props.store!.me) Router.login();
		else {
			Router.editArticle('feedback');
		}
	};

	@action // 下刷新
	private bottomRefresh = async (refreshState: RefreshStateType) => {
		if (refreshState === RefreshState.FooterRefreshing) {
			this.currPage = this.pageRange[1];
			// 当前页为最后一页
			if (this.currPage === this.totalPageCount) {
				this.refreshState = RefreshState.NoMoreData;
				return;
			}
			// 当前页非最后一页
			this.refreshState = refreshState;
			this.pageRange[1] = this.currPage + 1;
			// 下一页已缓存
			if (this.pageToItems.has(this.currPage + 1)) {
				this.feedbackItems.push(...this.pageToItems.get(this.currPage + 1)!);
				this.currPage += 1;
				this.refreshState = RefreshState.Idle;
				return;
			}
			// 获取下一页
			const html = await retryDo(async () => await req.GET_HTML(`/feedback?p=${this.currPage + 1}`) , 3);
			const result = takeItems(html);
			result.items = observable(result.items);
			runInAction(() => {
				this.currPage = result.currPage;
				this.totalPageCount = result.totalPage;
				this.feedbackItems.push(...result.items);
				this.refreshState = RefreshState.Idle;
			});
			// 缓存之
			this.pageToItems.set(result.currPage, result.items);
		}
	};

	@action // 上刷新
	private topRefresh = async (refreshState: RefreshStateType) => {
		if (refreshState === RefreshState.HeaderRefreshing) {
			this.currPage = this.pageRange[0];
			this.refreshState = refreshState;
			// 当前页为第一页，刷新所有数据，清除缓存
			if (this.currPage === 1) {
				this.pageRange[0] = this.pageRange[1] = 1;
				const html = await retryDo(async () => {
					const resp = await req.GET('/feedback', null, {
						responseType: 'text'
					});
					return resp.data;
				}, 3);
				const result = takeItems(html);
				runInAction(() => {
					this.currPage = result.currPage;
					this.totalPageCount = result.totalPage;
					this.feedbackItems.splice(0, this.feedbackItems.length);
					this.feedbackItems.push(...result.items);
					this.refreshState = RefreshState.Idle;
				});
				this.pageToItems.clear();
			} else {
				// 上一页已缓存
				this.pageRange[0] = this.currPage - 1;
				if (this.pageToItems.has(this.currPage - 1)) {
					this.feedbackItems.unshift(...this.pageToItems.get(this.currPage - 1)!);
					this.currPage -= 1;
					this.refreshState = RefreshState.Idle;
				} else {
					// 获取上一页
					const html = await retryDo(async () => {
						const resp = await req.GET(`/feedback?p=${this.currPage - 1}`, null, {
							responseType: 'text'
						});
						return resp.data;
					}, 3);
					const result = takeItems(html);
					result.items = observable(result.items);
					runInAction(() => {
						this.currPage = result.currPage;
						this.totalPageCount = result.totalPage;
						this.feedbackItems.unshift(...result.items);
						this.refreshState = RefreshState.Idle;
					});
					this.pageToItems.set(result.currPage, result.items);
				}
			}
		}
	};

	private onCurrPageSelect = async (currPage: number) => {
		this.loading = true;
		this.pageRange[0] = this.pageRange[1] = this.currPage = currPage;
		// 该页已缓存
		if (this.pageToItems.has(currPage)) {
			this.feedbackItems.splice(0, this.feedbackItems.length);
			this.feedbackItems.push(...this.pageToItems.get(currPage)!);
		} else {
			// 获取该页
			const html = await retryDo(async () => {
				const resp = await req.GET(`/feedback?p=${currPage}`, null, {
					responseType: 'text'
				});
				return resp.data;
			}, 3);
			const result = takeItems(html);
			result.items = observable(result.items);
			runInAction(() => {
				this.currPage = result.currPage;
				this.totalPageCount = result.totalPage;
				this.feedbackItems.splice(0, this.feedbackItems.length);
				this.feedbackItems.push(...result.items);
			});
			this.pageToItems.set(result.currPage, result.items);
		}
		this.list!.scrollToOffset({ animated: true, offset: 0 });
		this.loading = false;
	};

	componentDidMount() {
		const storage = this.props.store!.localStorage;
		try {
			(async () => {
				this.loading = true;
				try {
					let items = await storage.load<Item[]>({ key: 'feedbackItemsCache' });
					if (items) this.feedbackItems = observable(items);
				} catch (err) {}
				try {
					const html = await retryDo(async () => {
						const resp = await req.GET('/feedback', null, {
							responseType: 'text'
						});
						return resp.data;
					}, 3);
					const result = takeItems(html);
					result.items = observable(result.items);
					runInAction(() => {
						this.currPage = result.currPage;
						this.pageRange[0] = this.currPage;
						this.pageRange[1] = this.currPage;
						this.totalPageCount = result.totalPage;
						this.feedbackItems.splice(0, this.feedbackItems.length);
						this.feedbackItems.push(...result.items);
						this.loading = false;
					});
					this.pageToItems.set(result.currPage, result.items);
				} catch (err) {
					console.log(err);
					this.loading = false;
				}
			})();
		} catch (err) {
			console.log(err);
		}
		this.props.store!.onEditArticleOk(this.onEditArticleOk);
	}

	onEditArticleOk = (type: 'share' | 'feedback' | 'project') => {
		if (type === 'feedback') this.topRefresh(RefreshState.HeaderRefreshing);
	};

	componentWillUnmount() {
		this.props.store!.offEditArticleOk(this.onEditArticleOk);
		const storage = this.props.store!.localStorage;
		storage.save({
			key: 'feedbackItemsCache',
			data: this.feedbackItems.slice(0, 15)
		});
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BACK_WHITE
	} as ViewStyle,
	loading: {
		position: 'absolute',
		top: SCREEN_WIDTH * 0.05,
		right: SCREEN_WIDTH * 0.05
	} as ViewStyle
});
