import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import pytz
import numpy as np

# Load environment variables
load_dotenv()

# Constants
AUTH_URL = "https://auth.blumira.com/oauth/token"
API_BASE_URL = "https://api.blumira.com/public-api/v1"
APP_BASE_URL = "https://app.blumira.com"

def get_access_token():
    """Get access token using client credentials"""
    client_id = os.getenv("BLUMIRA_CLIENT_ID")
    client_secret = os.getenv("BLUMIRA_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        st.error("Please set BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables")
        return None
    
    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "audience": "public-api"
    }
    
    headers = {
        "content-type": "application/json"
    }
    
    try:
        response = requests.post(AUTH_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        st.error(f"Error getting access token: {str(e)}")
        return None

def fetch_msp_accounts(token):
    """Fetch MSP accounts"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_BASE_URL}/msp/accounts", headers=headers)
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"Error fetching MSP accounts: {str(e)}")
        return []

def fetch_all_findings(token):
    """Fetch findings across all accounts"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_BASE_URL}/msp/accounts/findings", headers=headers)
        response.raise_for_status()
        return response.json()["data"]
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            st.warning("Permission denied to fetch findings. Please check your API permissions.")
        else:
            st.error(f"Error fetching findings: {str(e)}")
        return []
    except Exception as e:
        st.error(f"Error fetching findings: {str(e)}")
        return []

def format_finding_priority(priority):
    """Format priority for display"""
    priority_colors = {
        1: "🔴 Critical",
        2: "🟠 High",
        3: "🟡 Medium",
        4: "🟢 Low",
        5: "⚪ Info"
    }
    return priority_colors.get(priority, f"Priority {priority}")

def get_finding_url(org_id, finding_id):
    """Generate URL for finding in Blumira app"""
    return f"{APP_BASE_URL}/{org_id}/reporting/findings/{finding_id}"

def display_finding_card(finding):
    """Display a finding in a compact card format"""
    st.markdown(f"""
        <div style="font-size: 0.9em; margin-bottom: 0.5em;">
            <a href="{finding['url']}" target="_blank" style="text-decoration: none; color: inherit;">
                <strong>{finding['name']}</strong>
            </a>
            <span style="float: right;">{finding['priority_formatted']}</span>
            <br>
            <small>
                {finding['org_name']} | {finding['created'].strftime('%Y-%m-%d %H:%M:%S')} | 
                {finding['status_name']} | {finding['type_name']}
            </small>
        </div>
    """, unsafe_allow_html=True)

def calculate_statistics(df):
    """Calculate various statistics from findings data"""
    stats = {}
    
    # Time-based statistics
    df['created'] = pd.to_datetime(df['created'])
    df['modified'] = pd.to_datetime(df['modified'])
    df['time_to_close'] = (df['modified'] - df['created']).dt.total_seconds() / 3600  # in hours
    
    # Resolution statistics (if available)
    if 'resolution_name' in df.columns:
        resolution_stats = df['resolution_name'].value_counts()
        stats['false_positives'] = resolution_stats.get('False Positive', 0)
        stats['valid_findings'] = resolution_stats.get('Valid', 0)
        stats['total_resolved'] = resolution_stats.sum()
    else:
        stats['false_positives'] = 0
        stats['valid_findings'] = 0
        stats['total_resolved'] = 0
    
    # Time to close statistics
    closed_findings = df[df['status_name'] != 'Open']
    if not closed_findings.empty:
        stats['avg_time_to_close'] = closed_findings['time_to_close'].mean()
        stats['median_time_to_close'] = closed_findings['time_to_close'].median()
        stats['max_time_to_close'] = closed_findings['time_to_close'].max()
    else:
        stats['avg_time_to_close'] = 0
        stats['median_time_to_close'] = 0
        stats['max_time_to_close'] = 0
    
    # Threat type distribution
    stats['threat_types'] = df['type_name'].value_counts()
    
    # Priority distribution
    stats['priority_dist'] = df['priority'].value_counts().sort_index()
    
    # Organization statistics
    stats['org_findings'] = df['org_name'].value_counts()
    
    return stats

def main():
    st.set_page_config(page_title="Blumira MSP Dashboard", layout="wide")
    st.title("Blumira MSP Dashboard")
    
    # Get access token
    token = get_access_token()
    if not token:
        st.stop()
    
    # Fetch MSP accounts
    accounts = fetch_msp_accounts(token)
    if not accounts:
        st.error("No MSP accounts found")
        st.stop()
    
    # Fetch all findings
    findings = fetch_all_findings(token)
    
    # Create a DataFrame from findings
    if findings:
        df_findings = pd.DataFrame(findings)
        df_findings["created"] = pd.to_datetime(df_findings["created"])
        df_findings["priority_formatted"] = df_findings["priority"].apply(format_finding_priority)
        
        # Add click-through URLs
        df_findings["url"] = df_findings.apply(lambda x: get_finding_url(x["org_id"], x["finding_id"]), axis=1)
        
        # Filter for recent findings (last 7 days)
        recent_date = datetime.now(pytz.UTC) - timedelta(days=7)
        recent_findings = df_findings[df_findings["created"].dt.tz_localize(None) >= recent_date.replace(tzinfo=None)]
        
        # Organization filter
        orgs = sorted(df_findings["org_name"].unique())
        selected_orgs = st.multiselect(
            "Filter by Organization",
            options=orgs,
            default=orgs
        )
        
        if selected_orgs:
            df_findings = df_findings[df_findings["org_name"].isin(selected_orgs)]
        
        # Critical Findings Section
        st.header("🚨 Critical Findings")
        critical_findings = df_findings[df_findings["priority"] == 1].sort_values("created", ascending=False)
        
        if not critical_findings.empty:
            with st.container():
                st.markdown("""
                    <style>
                        .finding-container {
                            max-height: 300px;
                            overflow-y: auto;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                        }
                    </style>
                """, unsafe_allow_html=True)
                
                with st.container():
                    st.markdown('<div class="finding-container">', unsafe_allow_html=True)
                    for _, finding in critical_findings.iterrows():
                        display_finding_card(finding)
                    st.markdown('</div>', unsafe_allow_html=True)
        else:
            st.success("No critical findings found!")
        
        # Recent Findings Section
        st.header("📅 Recent Findings (Last 7 Days)")
        recent_findings = recent_findings.sort_values(["priority", "created"], ascending=[True, False])
        
        show_all = st.button("Show All Findings")
        
        if not recent_findings.empty:
            if show_all:
                display_df = recent_findings.copy()
            else:
                display_df = recent_findings.head(10).copy()
            display_df["Finding"] = display_df.apply(lambda x: f'<a href="{x["url"]}" target="_blank">{x["name"]}</a>', axis=1)
            display_df["Date"] = display_df["created"].dt.strftime("%Y-%m-%d %H:%M:%S")
            display_df["Priority"] = display_df["priority_formatted"]
            display_df = display_df[["Finding", "org_name", "Date", "status_name", "type_name", "Priority"]]
            display_df.columns = ["Finding", "Organization", "Date", "Status", "Type", "Priority"]
            st.markdown(
                display_df.to_html(escape=False, index=False),
                unsafe_allow_html=True
            )
            st.caption(f"Showing {len(display_df)} of {len(recent_findings)} recent findings")
        else:
            st.info("No recent findings found!")
        
        # Metrics Section
        st.header("📊 Key Metrics")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Findings", len(df_findings))
        with col2:
            st.metric("Recent Findings (7d)", len(recent_findings))
        with col3:
            st.metric("Critical Findings", len(critical_findings))
        with col4:
            st.metric("Open Findings", len(df_findings[df_findings["status_name"] == "Open"]))
        
        # Statistical Analysis Section
        st.header("📈 Statistical Analysis")
        stats = calculate_statistics(df_findings)
        
        # Timeline Analysis
        st.subheader("📊 Timeline Analysis")
        
        # Create daily findings count
        df_findings['date'] = df_findings['created'].dt.date
        daily_findings = df_findings.groupby(['date', 'priority']).size().reset_index(name='count')
        daily_findings['priority_label'] = daily_findings['priority'].apply(format_finding_priority)
        
        # Create timeline visualization
        fig_timeline = go.Figure()
        for priority in sorted(daily_findings['priority'].unique()):
            priority_data = daily_findings[daily_findings['priority'] == priority]
            fig_timeline.add_trace(go.Scatter(
                x=priority_data['date'],
                y=priority_data['count'],
                name=format_finding_priority(priority),
                mode='lines+markers',
                stackgroup='one'
            ))
        
        fig_timeline.update_layout(
            title="Findings Timeline by Priority",
            xaxis_title="Date",
            yaxis_title="Number of Findings",
            hovermode="x unified",
            showlegend=True
        )
        st.plotly_chart(fig_timeline, use_container_width=True)
        
        # Current Position Analysis
        st.subheader("🎯 Current Position Analysis")
        
        # Calculate findings by priority and status
        priority_status = pd.crosstab(
            df_findings['priority_formatted'],
            df_findings['status_name'],
            margins=True
        )
        
        # Create heatmap
        fig_heatmap = px.imshow(
            priority_status,
            labels=dict(x="Status", y="Priority", color="Count"),
            aspect="auto",
            color_continuous_scale="RdYlBu_r"
        )
        fig_heatmap.update_layout(
            title="Findings Distribution by Priority and Status"
        )
        st.plotly_chart(fig_heatmap, use_container_width=True)
        
        # Priority Trend Analysis
        st.subheader("📈 Priority Trend Analysis")
        
        # Calculate rolling averages for each priority
        df_findings['hour'] = df_findings['created'].dt.floor('H')
        hourly_findings = df_findings.groupby(['hour', 'priority']).size().reset_index(name='count')
        
        # Create trend visualization
        fig_trend = go.Figure()
        for priority in sorted(hourly_findings['priority'].unique()):
            priority_data = hourly_findings[hourly_findings['priority'] == priority]
            # Calculate 24-hour rolling average
            priority_data['rolling_avg'] = priority_data['count'].rolling(window=24, min_periods=1).mean()
            
            fig_trend.add_trace(go.Scatter(
                x=priority_data['hour'],
                y=priority_data['rolling_avg'],
                name=format_finding_priority(priority),
                mode='lines'
            ))
        
        fig_trend.update_layout(
            title="24-Hour Rolling Average of Findings by Priority",
            xaxis_title="Time",
            yaxis_title="Average Findings per Hour",
            hovermode="x unified"
        )
        st.plotly_chart(fig_trend, use_container_width=True)
        
        # Priority Distribution by Organization
        st.subheader("🏢 Priority Distribution by Organization")
        
        # Calculate findings by organization and priority
        org_priority = pd.crosstab(
            df_findings['org_name'],
            df_findings['priority_formatted']
        )
        
        # Create stacked bar chart
        fig_org_priority = px.bar(
            org_priority,
            title="Findings Distribution by Organization and Priority",
            labels={'value': 'Count', 'index': 'Organization'},
            barmode='stack'
        )
        st.plotly_chart(fig_org_priority, use_container_width=True)
        
        # Resolution Statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("False Positives", stats['false_positives'])
        with col2:
            st.metric("Valid Findings", stats['valid_findings'])
        with col3:
            st.metric("Total Resolved", stats['total_resolved'])
        
        # Time to Close Statistics
        st.subheader("⏱️ Time to Close Analysis")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Average Time to Close", f"{stats['avg_time_to_close']:.1f} hours")
        with col2:
            st.metric("Median Time to Close", f"{stats['median_time_to_close']:.1f} hours")
        with col3:
            st.metric("Max Time to Close", f"{stats['max_time_to_close']:.1f} hours")
        
        # Threat Type Distribution
        st.subheader("🎯 Threat Type Distribution")
        fig_threat = px.bar(
            stats['threat_types'],
            title="Findings by Threat Type",
            labels={'value': 'Count', 'index': 'Threat Type'}
        )
        st.plotly_chart(fig_threat, use_container_width=True)
        
        # Organization Analysis
        st.subheader("🏢 Organization Analysis")
        fig_org = px.bar(
            stats['org_findings'],
            title="Findings by Organization",
            labels={'value': 'Count', 'index': 'Organization'}
        )
        st.plotly_chart(fig_org, use_container_width=True)
        
        # Priority Distribution
        st.subheader("📊 Priority Distribution")
        fig_priority = px.pie(
            df_findings,
            names="priority_formatted",
            title="Findings Distribution by Priority",
            color_discrete_sequence=px.colors.sequential.RdBu_r
        )
        st.plotly_chart(fig_priority, use_container_width=True)
        
        # Advanced Filtering
        st.header("🔍 Advanced Search")
        col1, col2, col3 = st.columns(3)
        with col1:
            priority_filter = st.multiselect(
                "Filter by Priority",
                options=sorted(df_findings["priority"].unique()),
                default=[]
            )
        with col2:
            status_filter = st.multiselect(
                "Filter by Status",
                options=sorted(df_findings["status_name"].unique()),
                default=[]
            )
        with col3:
            type_filter = st.multiselect(
                "Filter by Type",
                options=sorted(df_findings["type_name"].unique()),
                default=[]
            )
        
        # Apply filters
        filtered_df = df_findings
        if priority_filter:
            filtered_df = filtered_df[filtered_df["priority"].isin(priority_filter)]
        if status_filter:
            filtered_df = filtered_df[filtered_df["status_name"].isin(status_filter)]
        if type_filter:
            filtered_df = filtered_df[filtered_df["type_name"].isin(type_filter)]
        
        # Display filtered table
        st.dataframe(
            filtered_df[["name", "priority_formatted", "status_name", "type_name", "created", "org_name"]],
            column_config={
                "name": st.column_config.LinkColumn(
                    "Finding Name",
                    display_text="View in Blumira"
                ),
                "priority_formatted": "Priority",
                "status_name": "Status",
                "type_name": "Type",
                "created": "Created At",
                "org_name": "Organization"
            },
            hide_index=True,
            use_container_width=True
        )
    else:
        st.info("No findings found. This could be due to API permissions or no findings in the system.")

if __name__ == "__main__":
    main()
