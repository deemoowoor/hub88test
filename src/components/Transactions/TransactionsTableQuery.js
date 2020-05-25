import React from "react"

import {
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from "@material-ui/core"

import { Query } from "@apollo/react-components"
import { gql } from "@apollo/client"

import TablePagination from "@material-ui/core/TablePagination"
import TableContainer from "@material-ui/core/TableContainer"
import HourglassEmptyOutlined from "@material-ui/icons/HourglassEmptyOutlined"
import Error from "@material-ui/icons/Error"
import Paper from "@material-ui/core/Paper"

import EnhancedTable from "../EnhancedTable/EnhancedTable"
import EnhancedTableToolbar from "../EnhancedTable/EnhancedTableToolbar"

const getTransactionsQuery = (cursor, pageSize, order, orderBy) => gql`
  {
    transactionConnection(page: ${cursor}, pageSize: ${pageSize}, order: "${order}", orderBy: "${orderBy}") {
      edges {
        node {
          id
          uuid
          amount
          currency
        }
      }
      pageInfo {
        totalCount
        hasNextPage
      }
    }
    currencies {
      code
    }
  }
`

const columns = [
  {
    dataKey: "id",
    numeric: false,
    disablePadding: false,
    label: "ID",
    width: 200,
  },
  {
    dataKey: "amount",
    numeric: true,
    disablePadding: false,
    label: "Amount",
    width: 200,
  },
  {
    dataKey: "currency",
    numeric: false,
    disablePadding: false,
    label: "Currency",
    width: 200,
  },
]

export default function TransactionsTableQuery({ readonly }) {
  const [order, setOrder] = React.useState("asc")
  const [orderBy, setOrderBy] = React.useState("id")
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(50)
  const [selected, setSelected] = React.useState([])
  const [windowInnerHeight, setWindowInnerHeight] = React.useState(window.innerHeight)

  const updateWindowDimensions = event => {
    setWindowInnerHeight(window.innerHeight)
  }

  React.useEffect(() => {
    window.addEventListener('resize', updateWindowDimensions)
  })

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    if (typeof(event.target.value) === "string") {
      setRowsPerPage(parseInt(event.target.value, 50))
    } else {
      setRowsPerPage(event.target.value)
    }
    
    setPage(0)
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc"
    setOrder(isAsc ? "desc" : "asc")
    setOrderBy(property)
  }

  const handleRowClick = (_event, selectedIndex, rowData) => {
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, rowData.id)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    setSelected(newSelected)
  }

  return (
    <Query query={getTransactionsQuery(page, rowsPerPage, order, orderBy)}>
      {result => {
        const { error, data, loading } = result
        if (loading) {
          return (
            <Card className="rotate-div">
              <CardHeader
                avatar={
                  <HourglassEmptyOutlined
                    color="primary"
                    className="rotate-infinite"
                  />
                }
                title="Transactions list loading..."
              ></CardHeader>
              <CardContent>
                <Typography>Please, wait...</Typography>
              </CardContent>
              <LinearProgress color="primary" />
            </Card>
          )
        }

        if (!data || !data.transactionConnection.edges || error) {
          if (error) {
            console.error(error)
          }
          return (
            <Card className="rotate-div">
              <CardHeader
                avatar={<Error color="secondary" />}
                title="Loading transactions list failed!"
              ></CardHeader>
              <CardContent>
                <Typography>Error: {error || "no data"}</Typography>
              </CardContent>
            </Card>
          )
        }

        const rows = data.transactionConnection.edges.map(edge => edge.node)
        const totalCount = data.transactionConnection.pageInfo.totalCount

        const handleSelectAllClick = event => {
          if (event.target.checked) {
            const newSelecteds = rows.map(item => item.id)
            setSelected(newSelecteds)
            return
          }

          setSelected([])
        }

        return (
          <TableContainer>
            <EnhancedTableToolbar
              readonly={readonly}
              numSelected={selected.length}
            />
            <Paper style={{ height: windowInnerHeight - 164, width: "100%" }}>
              <EnhancedTable
                rows={rows}
                rowCount={rows.length}
                rowsPerPage={rowsPerPage}
                columns={columns}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                onRowClick={handleRowClick}
                onSelectAllClick={handleSelectAllClick}
                readonly={readonly}
                selected={selected}
              />
            </Paper>
            <TablePagination
              rowsPerPageOptions={[10, 50, 100, 500, 1000, 10000]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </TableContainer>
        )
      }}
    </Query>
  )
}
