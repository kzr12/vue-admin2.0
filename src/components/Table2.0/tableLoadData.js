import { reactive } from "@vue/composition-api";
import { requestUrl, loadTableData } from "@/api/requestUrl"
export function LoadData() {
    //数据
    const tableData = reactive({
        item: [],
        total: 0,
    })
    //方法
    const tableLoadData = (params) => {
        let reqJson = params;
        let reqData = {
            url: requestUrl[reqJson.url],
            method: reqJson.method,
            data: reqJson.data
        }
        loadTableData(reqData).then(res => {
            let resData = res.data.data;
            tableData.item = resData.data;
            tableData.total = resData.total;
        }).catch(err => {

        })
    }


    return {
        tableData, tableLoadData
    }
}
