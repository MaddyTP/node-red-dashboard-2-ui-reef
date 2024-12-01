# node-red-dashboard-2-ui-reef

[![platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)

These nodes were designed to facilitate the creation of a Node-RED aquarium or hydroponics controller.  [@flowfuse/node-red-dashboard](https://github.com/FlowFuse/node-red-dashboard) is required and must be installed first.

![image](https://github.com/user-attachments/assets/45d72fb3-75d3-4292-9a21-90a52e99d75a)

## Install

Either use the Manage Palette option in the Node-RED Editor menu, or run the following command in your Node-RED user directory - typically `~/.node-red`

```javascript
npm install @maddytp/node-red-dashboard-2-ui-reef
```

## Feed

<img width="314" alt="Screenshot 2024-11-30 at 15 02 45" src="https://github.com/user-attachments/assets/d75b042f-f4ea-4e72-b273-0c95725499a2">

<img width="314" alt="Screenshot 2024-11-30 at 15 02 45" src="https://github.com/user-attachments/assets/bc3c5588-6710-410f-9d17-9ec0e701d7f7">


Feed node is intended to trigger feed or maintenance cycles.  The `On Start` value is sent when first initialized with the `On Cancel` value sent at the end of countdown or when cancelled.

## Probe

<img width="314" alt="Screenshot 2024-11-30 at 15 02 45" src="https://github.com/user-attachments/assets/e242aeea-b4a5-465d-b03a-402a20b852d5">


Probe accepts two types of data, live data or stored data.  Live data can be fed via `msg.payload` or stored data via an array of objects with an `x` and `y` property:

Live data:
```javascript
msg = { payload: 8.15 }
```

Stored data:
```javascript
msg = {
    payload: [
        { x: 1520527095000, y: 8.15 },
        { x: 1520934095000, y: 8.17 }
    ]
}
```

When providing data for the time scale, this node uses timestamps defined as milliseconds since epoch (midnight January 1, 1970, UTC) internally. However, it will also accept most datetime formats.  

Value on the right will show most recent datapoint whether that be live data or stored data.  If a symbol is specified it will be appended to this value only.  Time component will be validated against the configured timeframe and older values dropped.  Additionally, there are options to round values to a decimal place and/or map value(s) to a range.

## Output

<img width="314" alt="Screenshot 2024-11-30 at 15 02 45" src="https://github.com/user-attachments/assets/028b023b-5db4-4f31-b580-d9fe88294633">


Output node combines elements of the core `function` and dashboard `button group` nodes to allow static or dynamic output. Static options send value on selection whereas the function option will modify `msg` inputs in the same way the core `function` node operates.

If `msg.display` property is set in function the value will be sent to the UI to be displayed in the upper-right hand of widget.  Switch state is stored in node context so it can be restored on restart if Node-RED settings specify "localfilesystem" as store. Color option allows specific colors to be set for different switch positions.

## Input

<img width="314" alt="Screenshot 2024-11-30 at 15 02 45" src="https://github.com/user-attachments/assets/08e20c01-3075-40b9-96dd-6a8896a3ce6a">


Input node is a modification of dashboard `button-group` node which sets switch based on input value.  Color option allows specific colors to be set for different switch positions. 

## Important Note

These nodes would not be possible without the following projects:

* Node-Red - [Node-RED](https://github.com/node-red/node-red)
* FlowFuse Dashboard - [@flowfuse/node-red-dashboard](https://github.com/FlowFuse/node-red-dashboard)
